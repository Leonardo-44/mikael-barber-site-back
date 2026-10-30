// ============================================
//  routes/commissions.js — Mikael Barber (Neon)
//  Lista e edita o % de comissão de serviços e produtos.
//  Só o admin pode ver e alterar. NÃO mexe nas rotas
//  /services e /products já existentes.
// ============================================

import express from 'express';
import { neon } from '@neondatabase/serverless';
import { authMiddleware } from '../middlewares/auth.js';

const router = express.Router();
const sql = neon(process.env.DATABASE_URL);

// Valida o percentual: número entre 0 e 100
function parsePercent(value) {
  const n = parseFloat(value);
  if (isNaN(n) || n < 0 || n > 100) return null;
  return Math.round(n * 100) / 100;
}

// Valida o id da URL (evita erro 500 do Postgres com id inválido)
function parseId(value) {
  const n = parseInt(value, 10);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// ── Só admin passa daqui ──
// Tenta achar o username no que o authMiddleware guardou em req.user.
// Se o token só tiver o id, busca o username na tabela barbers.
async function adminOnly(req, res, next) {
  try {
    const adminUsername = process.env.ADMIN_USERNAME;
    if (!adminUsername) {
      console.error('[commissions] ADMIN_USERNAME não definido no .env');
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

// ── GET /api/commissions — serviços + produtos com a comissão de cada um ──
router.get('/', authMiddleware, adminOnly, async (_req, res) => {
  try {
    const services = await sql`
      SELECT id, label, price, commission_percent
      FROM services
      ORDER BY label ASC
    `;
    const products = await sql`
      SELECT id, name, price, category, commission_percent
      FROM products
      ORDER BY name ASC
    `;
    res.json({ services, products });
  } catch (err) {
    console.error('[commissions] GET error:', err);
    res.status(500).json({ error: 'Erro ao buscar comissões' });
  }
});

// ── PATCH /api/commissions/services/:id — altera a comissão de um serviço ──
router.patch('/services/:id', authMiddleware, adminOnly, async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: 'ID inválido' });

  const percent = parsePercent(req.body.commission_percent);
  if (percent === null) {
    return res.status(400).json({ error: 'Comissão deve estar entre 0 e 100' });
  }

  try {
    const [service] = await sql`
      UPDATE services
      SET commission_percent = ${percent}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, label, price, commission_percent
    `;
    if (!service) return res.status(404).json({ error: 'Serviço não encontrado' });
    res.json({ service });
  } catch (err) {
    console.error('[commissions] PATCH service error:', err);
    res.status(500).json({ error: 'Erro ao atualizar comissão do serviço' });
  }
});

// ── PATCH /api/commissions/products/:id — altera a comissão de um produto ──
router.patch('/products/:id', authMiddleware, adminOnly, async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: 'ID inválido' });

  const percent = parsePercent(req.body.commission_percent);
  if (percent === null) {
    return res.status(400).json({ error: 'Comissão deve estar entre 0 e 100' });
  }

  try {
    const [product] = await sql`
      UPDATE products
      SET commission_percent = ${percent}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, name, price, category, commission_percent
    `;
    if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json({ product });
  } catch (err) {
    console.error('[commissions] PATCH product error:', err);
    res.status(500).json({ error: 'Erro ao atualizar comissão do produto' });
  }
});

export default router;