// ============================================
//  routes/services.js — Mikael Barber (Neon)
// ============================================

import express from 'express';
import { neon } from '@neondatabase/serverless';
import { authMiddleware } from '../middlewares/auth.js';

const router = express.Router();
const sql = neon(process.env.DATABASE_URL);

// ── GET /api/services — todos podem ver ──────
router.get('/', authMiddleware, async (_req, res) => {
  try {
    const services = await sql`
      SELECT * FROM services ORDER BY label ASC
    `;
    res.json({ services });
  } catch (err) {
    console.error('[services] GET error:', err);
    res.status(500).json({ error: 'Erro ao buscar serviços' });
  }
});

// ── POST /api/services — só admin ────────────
router.post('/', authMiddleware, async (req, res) => {
  const { label, price } = req.body;

  if (!label?.trim())                return res.status(400).json({ error: 'Nome obrigatório' });
  if (price == null || isNaN(price)) return res.status(400).json({ error: 'Valor inválido' });

  try {
    const [service] = await sql`
      INSERT INTO services (label, price)
      VALUES (${label.trim()}, ${parseFloat(price)})
      RETURNING *
    `;
    res.status(201).json({ service });
  } catch (err) {
    console.error('[services] POST error:', err);
    res.status(500).json({ error: 'Erro ao criar serviço' });
  }
});

// ── PUT /api/services/:id — só admin ─────────
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { label, price } = req.body;

  if (!label?.trim())                return res.status(400).json({ error: 'Nome obrigatório' });
  if (price == null || isNaN(price)) return res.status(400).json({ error: 'Valor inválido' });

  try {
    const [service] = await sql`
      UPDATE services
      SET label = ${label.trim()}, price = ${parseFloat(price)}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    if (!service) return res.status(404).json({ error: 'Serviço não encontrado' });
    res.json({ service });
  } catch (err) {
    console.error('[services] PUT error:', err);
    res.status(500).json({ error: 'Erro ao atualizar serviço' });
  }
});

// ── DELETE /api/services/:id — só admin ──────
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    await sql`DELETE FROM services WHERE id = ${id}`;
    res.json({ message: 'Serviço removido com sucesso' });
  } catch (err) {
    console.error('[services] DELETE error:', err);
    res.status(500).json({ error: 'Erro ao remover serviço' });
  }
});

export default router;