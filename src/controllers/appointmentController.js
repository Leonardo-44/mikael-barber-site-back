import { sql } from '../config/database.js';

// Busca consumíveis de uma lista de appointment IDs e agrupa por appointment_id
async function fetchConsumables(appointmentIds) {
  if (!appointmentIds.length) return {};
  const rows = await sql`
    SELECT * FROM consumables WHERE appointment_id = ANY(${appointmentIds})
  `;
  return rows.reduce((acc, c) => {
    if (!acc[c.appointment_id]) acc[c.appointment_id] = [];
    acc[c.appointment_id].push({ name: c.name, price: c.price });
    return acc;
  }, {});
}

// Monta appointments com array de consumables embutido
function mergeConsumables(appointments, consMap) {
  return appointments.map((a) => ({
    ...a,
    consumables: consMap[a.id] || [],
  }));
}

export async function getMyAppointments(req, res) {
  try {
    const { id: barberId, name: barberName } = req.barber;
    const { date } = req.query;

    const rows = date
      ? await sql`
          SELECT * FROM appointments
          WHERE barber_id = ${barberId} AND date = ${date}
          ORDER BY time DESC
        `
      : await sql`
          SELECT * FROM appointments
          WHERE barber_id = ${barberId}
          ORDER BY created_at DESC
          LIMIT 50
        `;

    const ids = rows.map((r) => r.id);
    const consMap = await fetchConsumables(ids);

    return res.json({ appointments: mergeConsumables(rows, consMap) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao buscar agendamentos' });
  }
}

export async function getAllAppointments(req, res) {
  try {
    const { date } = req.query;

    const rows = date
      ? await sql`
          SELECT * FROM appointments WHERE date = ${date}
          ORDER BY time DESC
        `
      : await sql`
          SELECT * FROM appointments
          ORDER BY created_at DESC
          LIMIT 50
        `;

    const ids = rows.map((r) => r.id);
    const consMap = await fetchConsumables(ids);

    return res.json({ appointments: mergeConsumables(rows, consMap) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao buscar agendamentos' });
  }
}

export async function createAppointment(req, res) {
  const { id: barberId, name: barberName } = req.barber;

  // Campos vindos do AppointmentForm.jsx
  const {
    clientName,       // nome do cliente
    clientPhone,      // telefone
    cut,              // tipo de corte
    price,            // total (serviço + consumíveis)
    servicePrice,     // só o serviço
    consumables = [], // [{ name, price }]
    obs,
    status = 'pending',
    date,
    time,
  } = req.body;

  if (!clientName || !cut) {
    return res.status(400).json({ error: 'Nome do cliente e corte são obrigatórios' });
  }

  try {
    const now = new Date();
    const recordDate = date || now.toLocaleDateString('pt-BR');
    const recordTime = time || now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // Insere o agendamento
    const apptRows = await sql`
      INSERT INTO appointments
        (barber_id, barber_name, client_name, client_phone, cut,
         service_price, total_price, obs, status, date, time)
      VALUES
        (${barberId}, ${barberName}, ${clientName}, ${clientPhone ?? null}, ${cut},
         ${servicePrice ?? null}, ${price ?? null}, ${obs ?? null},
         ${status}, ${recordDate}, ${recordTime})
      RETURNING *
    `;

    const appt = apptRows[0];

    // Insere os consumíveis (se houver)
    if (consumables.length > 0) {
      for (const c of consumables) {
        await sql`
          INSERT INTO consumables (appointment_id, name, price)
          VALUES (${appt.id}, ${c.name}, ${parseFloat(c.price) || 0})
        `;
      }
    }

    return res.status(201).json({
      appointment: { ...appt, consumables },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao criar agendamento' });
  }
}

export async function updateStatus(req, res) {
  // Chamado quando o barbeiro muda o status pelo StatusSelect na lista
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

    return res.json({ appointment: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao atualizar status' });
  }
}

export async function deleteAppointment(req, res) {
  const { id } = req.params;
  const { id: barberId } = req.barber;

  try {
    // consumables deletados automaticamente pelo ON DELETE CASCADE
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
    const today = new Date().toLocaleDateString('pt-BR');

    const [todayStats, weekStats, topCuts] = await Promise.all([
      sql`
        SELECT COUNT(*) AS total, COALESCE(SUM(total_price), 0) AS revenue
        FROM appointments
        WHERE barber_id = ${barberId} AND date = ${today} AND status = 'done'
      `,
      sql`
        SELECT COUNT(*) AS total, COALESCE(SUM(total_price), 0) AS revenue
        FROM appointments
        WHERE barber_id = ${barberId}
          AND created_at >= NOW() - INTERVAL '7 days'
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
      week: weekStats[0],
      topCuts,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
}