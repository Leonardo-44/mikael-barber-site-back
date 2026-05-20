import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sql } from '../config/database.js';
import 'dotenv/config';

export async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
  }

  try {
    const rows = await sql`
      SELECT * FROM barbers WHERE username = ${username} LIMIT 1
    `;

    const barber = rows[0];

    if (!barber) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    }

    const valid = await bcrypt.compare(password, barber.password);

    if (!valid) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    }

    const token = jwt.sign(
      { id: barber.id, name: barber.name, username: barber.username },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({
      token,
      barber: {
        id: barber.id,
        name: barber.name,
        username: barber.username,
        avatar: barber.avatar,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export async function me(req, res) {
  return res.json({ barber: req.barber });
}

export async function register(req, res) {
  const { name, username, password } = req.body;

  if (!name || !username || !password) {
    return res.status(400).json({ error: 'Nome, usuário e senha são obrigatórios' });
  }

  // Só o admin pode criar barbeiros
  if (req.barber?.username?.toLowerCase() !== import.meta.env.ADMIN_USERNAME?.toLowerCase()) {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  try {
    // Verifica se usuário já existe
    const existing = await sql`
      SELECT id FROM barbers WHERE username = ${username} LIMIT 1
    `;

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Usuário já existe' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const rows = await sql`
      INSERT INTO barbers (name, username, password)
      VALUES (${name}, ${username}, ${hashed})
      RETURNING id, name, username
    `;

    return res.status(201).json({ barber: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao criar barbeiro' });
  }
}

export async function getBarbers(req, res) {
  if (req.barber?.username?.toLowerCase() !== import.meta.env.ADMIN_USERNAME?.toLowerCase()) {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  try {
    const barbers = await sql`
      SELECT id, name, username FROM barbers ORDER BY name ASC
    `;
    return res.json({ barbers });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao buscar barbeiros' });
  }
}