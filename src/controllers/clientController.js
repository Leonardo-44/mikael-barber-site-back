import { sql } from '../config/database.js';

export async function getClients(req, res) {
  try {
    const rows = await sql`
      SELECT * FROM clients ORDER BY name ASC
    `;
    return res.json({ clients: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao buscar clientes' });
  }
}

export async function createClient(req, res) {
  const { name, phone, obs } = req.body;
  if (!name?.trim()) {
    return res.status(400).json({ error: 'Nome é obrigatório' });
  }
  try {
    const rows = await sql`
      INSERT INTO clients (name, phone, obs)
      VALUES (${name.trim()}, ${phone?.trim() ?? null}, ${obs?.trim() ?? null})
      RETURNING *
    `;
    return res.status(201).json({ client: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao criar cliente' });
  }
}

export async function updateClient(req, res) {
  const { id } = req.params;
  const { name, phone, obs } = req.body;
  try {
    const rows = await sql`
      UPDATE clients SET
        name  = ${name?.trim() || ''},
        phone = ${phone?.trim() ?? null},
        obs   = ${obs?.trim() ?? null}
      WHERE id = ${id}
      RETURNING *
    `;
    if (!rows[0]) return res.status(404).json({ error: 'Cliente não encontrado' });
    return res.json({ client: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao atualizar cliente' });
  }
}

export async function deleteClient(req, res) {
  const { id } = req.params;
  try {
    const rows = await sql`
      DELETE FROM clients WHERE id = ${id} RETURNING id
    `;
    if (!rows[0]) return res.status(404).json({ error: 'Cliente não encontrado' });
    return res.json({ message: 'Cliente removido com sucesso' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao deletar cliente' });
  }
}