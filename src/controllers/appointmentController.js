import { sql } from '../config/database.js';

// ── helpers ──────────────────────────────────────────────────────────────────

// Normaliza a linha do banco para o formato que o frontend espera
function formatRow(a) {
  const scheduled = a.scheduled_at ? new Date(a.scheduled_at) : null;
  return {
    ...a,
    barber_name:  a.barber_name  || null,           // vem do JOIN abaixo
    consumables:  Array.isArray(a.consumables)
                    ? a.consumables
                    : (a.consumables ? JSON.parse(a.consumables) : []),
    date: scheduled
      ? scheduled.toLocaleDateString('pt-BR')
      : null,
    time: scheduled
      ? scheduled.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      : null,
  };
}

// ── controllers ──────────────────────────────────────────────────────────────

export async function getMyAppointments(req, res) {
  try {
    const { id: barberId } = req.barber;
    const { date } = req.query; // formato: DD/MM/YYYY (pt-BR)

    let rows;

    if (date) {
      // Converte DD/MM/YYYY → YYYY-MM-DD para filtrar no banco
      const [d, m, y] = date.split('/');
      const iso = `${y}-${m}-${d}`;

      rows = await sql`
        SELECT a.*, b.name AS barber_name
        FROM appointments a
        JOIN barbers b ON b.id = a.barber_id
        WHERE a.barber_id = ${barberId}
          AND DATE(a.scheduled_at) = ${iso}
        ORDER BY a.scheduled_at DESC
      `;
    } else {
      rows = await sql`
        SELECT a.*, b.name AS barber_name
        FROM appointments a
        JOIN barbers b ON b.id = a.barber_id
        WHERE a.barber_id = ${barberId}
        ORDER BY a.created_at DESC
        LIMIT 50
      `;
    }

    return res.json({ appointments: rows.map(formatRow) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao buscar agendamentos' });
  }
}

export async function getAllAppointments(req, res) {
  try {
    const { date } = req.query;

    let rows;

    if (date) {
      const [d, m, y] = date.split('/');
      const iso = `${y}-${m}-${d}`;

      rows = await sql`
        SELECT a.*, b.name AS barber_name
        FROM appointments a
        JOIN barbers b ON b.id = a.barber_id
        WHERE DATE(a.scheduled_at) = ${iso}
        ORDER BY a.scheduled_at DESC
      `;
    } else {
      rows = await sql`
        SELECT a.*, b.name AS barber_name
        FROM appointments a
        JOIN barbers b ON b.id = a.barber_id
        ORDER BY a.created_at DESC
        LIMIT 50
      `;
    }

    return res.json({ appointments: rows.map(formatRow) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao buscar agendamentos' });
  }
}

export async function createAppointment(req, res) {
  const { id: barberId } = req.barber;

  const {
    clientName,
    clientPhone,
    cut,
    price,
    servicePrice,
    consumables = [],
    obs,
    status = 'pending',
    date,
    time,
  } = req.body;

  if (!clientName || !cut) {
    return res.status(400).json({ error: 'Nome do cliente e corte são obrigatórios' });
  }

  try {
    let scheduledAt = new Date();

    if (date && time) {
      const [d, m, y] = date.split('/');
      scheduledAt = new Date(`${y}-${m}-${d}T${time}:00`);
    } else if (date) {
      const [d, m, y] = date.split('/');
      scheduledAt = new Date(`${y}-${m}-${d}T00:00:00`);
    }

    const consumablesJson = JSON.stringify(
      consumables.map((c) => ({ name: c.name, price: parseFloat(c.price) || 0 }))
    );

    // ✅ Sem ::jsonb — passa como string, o Postgres infere o tipo pela coluna
    const rows = await sql`
      INSERT INTO appointments
        (barber_id, client_name, client_phone, cut,
         service_price, total_price, consumables,
         obs, status, scheduled_at)
      VALUES
        (${barberId}, ${clientName.trim()}, ${clientPhone?.trim() ?? null}, ${cut},
         ${servicePrice ?? null}, ${price ?? null}, ${consumablesJson},
         ${obs?.trim() ?? null}, ${status}, ${scheduledAt.toISOString()})
      RETURNING *
    `;

    const appt = rows[0];
    const barberRows = await sql`SELECT name FROM barbers WHERE id = ${barberId}`;
    appt.barber_name = barberRows[0]?.name ?? null;

    return res.status(201).json({ appointment: formatRow(appt) });
  } catch (err) {
    console.error('Erro createAppointment:', err); // ← vai aparecer no log do Render
    return res.status(500).json({ error: err.message }); // ← temporário para ver o erro real
  }
}

export async function updateStatus(req, res) {
  const { id } = req.params;
  const { id: barberId } = req.barber;
  const { status } = req.body;

  const validStatus = ['done', 'pending', 'cancelled'];
  if (!validStatus.includes(status)) {
    return res.status(400).json({ error: 'Status inválido' });
  }

  try {
    const rows = await sql`
      UPDATE appointments SET status = ${status}
      WHERE id = ${id} AND barber_id = ${barberId}
      RETURNING *
    `;

    if (!rows[0]) return res.status(404).json({ error: 'Agendamento não encontrado' });

    return res.json({ appointment: formatRow(rows[0]) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao atualizar status' });
  }
}

export async function deleteAppointment(req, res) {
  const { id } = req.params;
  const { id: barberId } = req.barber;

  try {
    const rows = await sql`
      DELETE FROM appointments
      WHERE id = ${id} AND barber_id = ${barberId}
      RETURNING id
    `;

    if (!rows[0]) return res.status(404).json({ error: 'Agendamento não encontrado' });

    return res.json({ message: 'Agendamento removido com sucesso' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao deletar agendamento' });
  }
}

export async function getDashboardStats(req, res) {
  const { id: barberId } = req.barber;

  try {
    // "hoje" em UTC — ajuste o fuso se necessário
    const todayIso = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const [todayStats, weekStats, topCuts] = await Promise.all([
      sql`
        SELECT COUNT(*) AS total, COALESCE(SUM(total_price), 0) AS revenue
        FROM appointments
        WHERE barber_id = ${barberId}
          AND DATE(scheduled_at) = ${todayIso}
          AND status = 'done'
      `,
      sql`
        SELECT COUNT(*) AS total, COALESCE(SUM(total_price), 0) AS revenue
        FROM appointments
        WHERE barber_id = ${barberId}
          AND scheduled_at >= NOW() - INTERVAL '7 days'
          AND status = 'done'
      `,
      sql`
        SELECT cut, COUNT(*) AS count
        FROM appointments
        WHERE barber_id = ${barberId}
        GROUP BY cut
        ORDER BY count DESC
        LIMIT 5
      `,
    ]);

    return res.json({
      today: todayStats[0],
      week:  weekStats[0],
      topCuts,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
}