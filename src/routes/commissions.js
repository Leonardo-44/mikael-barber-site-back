import express from 'express';
import { neon } from '@neondatabase/serverless';
import { authMiddleware } from '../middlewares/auth.js';

const router = express.Router();
const sql = neon(process.env.DATABASE_URL);

const TARGETS = ['none', 'attendant', 'barber'];

function parsePercent(value) {
  const n = parseFloat(value);
  if (isNaN(n) || n < 0 || n > 100) return null;
  return Math.round(n * 100) / 100;
}

function parseId(value) {
  const n = parseInt(value, 10);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function parseCommission(body) {
  const target = TARGETS.includes(body.commission_target) ? body.commission_target : null;
  let percent = parsePercent(body.commission_percent);
  if (target === null || percent === null) return null;
  if (target === 'none') percent = 0;
  return { percent, target };
}

async function adminOnly(req, res, next) {
  try {
    const adminUsername = process.env.ADMIN_USERNAME;
    if (!adminUsername) {
      return res.status(500).json({ error: 'Servidor sem admin configurado' });
    }
    let username = req.user?.username || req.barber?.username;
    if (!username) {
      const id = req.user?.id ?? req.barber?.id;
      if (id) {
        const [row] = await sql`SELECT username FROM barbers WHERE id = ${id}`;
        username = row?.username;
      }
    }
    if (username !== adminUsername) {
      return res.status(403).json({ error: 'Acesso restrito ao admin' });
    }
    next();
  } catch (err) {
    console.error('[commissions] adminOnly error:', err);
    res.status(500).json({ error: 'Erro ao verificar permissão' });
  }
}

router.get('/', authMiddleware, adminOnly, async (_req, res) => {
  try {
    const services = await sql`
      SELECT id, label, price, commission_percent, commission_target
      FROM services ORDER BY label ASC
    `;
    const products = await sql`
      SELECT id, name, price, category, commission_percent, commission_target
      FROM products ORDER BY name ASC
    `;
    res.json({ services, products });
  } catch (err) {
    console.error('[commissions] GET error:', err);
    res.status(500).json({ error: 'Erro ao buscar comissões' });
  }
});

router.patch('/services/:id', authMiddleware, adminOnly, async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: 'ID inválido' });
  const c = parseCommission(req.body);
  if (!c) return res.status(400).json({ error: 'Comissão ou destino inválido' });

  try {
    const [service] = await sql`
      UPDATE services
      SET commission_percent = ${c.percent}, commission_target = ${c.target}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, label, price, commission_percent, commission_target
    `;
    if (!service) return res.status(404).json({ error: 'Serviço não encontrado' });
    res.json({ service });
  } catch (err) {
    console.error('[commissions] PATCH service error:', err);
    res.status(500).json({ error: 'Erro ao atualizar comissão do serviço' });
  }
});

router.patch('/products/:id', authMiddleware, adminOnly, async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: 'ID inválido' });
  const c = parseCommission(req.body);
  if (!c) return res.status(400).json({ error: 'Comissão ou destino inválido' });

  try {
    const [product] = await sql`
      UPDATE products
      SET commission_percent = ${c.percent}, commission_target = ${c.target}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, name, price, category, commission_percent, commission_target
    `;
    if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json({ product });
  } catch (err) {
    console.error('[commissions] PATCH product error:', err);
    res.status(500).json({ error: 'Erro ao atualizar comissão do produto' });
  }
});

export default router;