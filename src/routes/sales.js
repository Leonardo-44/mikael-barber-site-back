// ============================================
//  routes/sales.js — Mikael Barber (Neon)
//  Vendas de produtos registradas no balcão pelo recepcionista.
// ============================================

import express from 'express';
import { neon } from '@neondatabase/serverless';
import { authMiddleware } from '../middlewares/auth.js';

const router = express.Router();
const sql = neon(process.env.DATABASE_URL);

// Fuso do Piauí — "hoje" precisa seguir o horário local, não o UTC do servidor
const TZ = 'America/Fortaleza';

// ── GET /api/sales?period=day|week|month ─────
router.get('/', authMiddleware, async (req, res) => {
  const period = ['day', 'week', 'month'].includes(req.query.period)
    ? req.query.period
    : 'day';

  try {
    const sales = await sql`
      SELECT *
      FROM sales
      WHERE date_trunc(${period}, created_at AT TIME ZONE ${TZ}::text)
    = date_trunc(${period}, NOW() AT TIME ZONE ${TZ}::text)
      ORDER BY created_at DESC
    `;
    res.json({ sales });
  } catch (err) {
    console.error('[sales] GET error:', err);
    res.status(500).json({ error: 'Erro ao buscar vendas' });
  }
});

// ── POST /api/sales — registra uma venda ─────
// Body: { client_name, product_id, quantity, sold_by }
// O preço e a comissão vêm do BANCO, nunca do navegador.
router.post('/', authMiddleware, async (req, res) => {
  const { client_name, product_id, sold_by } = req.body;
  const quantity = parseInt(req.body.quantity, 10) || 1;

  if (!client_name?.trim()) return res.status(400).json({ error: 'Informe o nome do cliente' });
  if (!product_id)          return res.status(400).json({ error: 'Selecione o produto' });
  if (quantity < 1)         return res.status(400).json({ error: 'Quantidade inválida' });

  try {
    // 1) Dá baixa no estoque só se houver quantidade suficiente
    const [product] = await sql`
      UPDATE products
      SET stock = stock - ${quantity}, updated_at = NOW()
      WHERE id = ${product_id} AND stock >= ${quantity}
      RETURNING id, name, price, stock, commission_percent
    `;

    if (!product) {
      return res.status(400).json({ error: 'Produto não encontrado ou estoque insuficiente' });
    }

    // 2) Registra a venda com os valores daquele momento
    const unitPrice  = parseFloat(product.price);
    const percent    = parseFloat(product.commission_percent || 0);
    const total      = Math.round(unitPrice * quantity * 100) / 100;
    const commission = Math.round(total * percent) / 100;

    try {
      const [sale] = await sql`
        INSERT INTO sales (
          client_name, product_id, product_name, quantity,
          unit_price, total, commission_percent, commission_value, sold_by
        )
        VALUES (
          ${client_name.trim()}, ${String(product.id)}, ${product.name}, ${quantity},
          ${unitPrice}, ${total}, ${percent}, ${commission}, ${sold_by || null}
        )
        RETURNING *
      `;
      res.status(201).json({ sale, stock: product.stock });
    } catch (insertErr) {
      // Se salvar a venda falhar, devolve o estoque que acabou de sair
      await sql`UPDATE products SET stock = stock + ${quantity} WHERE id = ${product_id}`;
      throw insertErr;
    }
  } catch (err) {
    console.error('[sales] POST error:', err);
    res.status(500).json({ error: 'Erro ao registrar venda' });
  }
});

// ── DELETE /api/sales/:id — cancela venda e devolve o estoque ──
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const [sale] = await sql`
      DELETE FROM sales WHERE id = ${req.params.id} RETURNING *
    `;
    if (!sale) return res.status(404).json({ error: 'Venda não encontrada' });

    await sql`
      UPDATE products
      SET stock = stock + ${sale.quantity}, updated_at = NOW()
      WHERE id = ${sale.product_id}
    `;
    res.json({ message: 'Venda cancelada e estoque devolvido' });
  } catch (err) {
    console.error('[sales] DELETE error:', err);
    res.status(500).json({ error: 'Erro ao cancelar venda' });
  }
});

export default router;