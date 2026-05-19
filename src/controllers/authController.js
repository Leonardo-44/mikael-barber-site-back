import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sql } from '../config/database.js';

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
