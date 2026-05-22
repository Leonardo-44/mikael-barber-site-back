// ============================================
//  routes/products.js — Mikael Barber
// ============================================
import express from 'express';
import { neon } from '@neondatabase/serverless';
import { authMiddleware } from '../middlewares/auth.js'; 

const router = express.Router();
const sql = neon(process.env.DATABASE_URL);

// ── GET /api/products — lista todos ──
router.get('/', authenticateToken, async (req, res) => {
  try {
    const rows = await sql`
      SELECT * FROM products ORDER BY name ASC
    `;
    res.json({ products: rows });
  } catch (err) {
    console.error('[products] GET error:', err);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

// ── POST /api/products — cria produto ──
router.post('/', authenticateToken, async (req, res) => {
  const { name, price, unit = 'un', stock = 0, category = 'outros' } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ error: 'Nome é obrigatório' });
  }
  if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
    return res.status(400).json({ error: 'Preço inválido' });
  }

  try {
    const [product] = await sql`
      INSERT INTO products (name, price, unit, stock, category)
      VALUES (${name.trim()}, ${parseFloat(price)}, ${unit}, ${parseInt(stock)}, ${category})
      RETURNING *
    `;
    res.status(201).json({ product });
  } catch (err) {
    console.error('[products] POST error:', err);
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

// ── PUT /api/products/:id — atualiza produto ──
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, price, unit, stock, category } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ error: 'Nome é obrigatório' });
  }

  try {
    const [product] = await sql`
      UPDATE products
      SET
        name      = ${name.trim()},
        price     = ${parseFloat(price)},
        unit      = ${unit || 'un'},
        stock     = ${parseInt(stock) || 0},
        category  = ${category || 'outros'},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json({ product });
  } catch (err) {
    console.error('[products] PUT error:', err);
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

// ── DELETE /api/products/:id — remove produto ──
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await sql`DELETE FROM products WHERE id = ${id}`;
    res.json({ message: 'Produto removido' });
  } catch (err) {
    console.error('[products] DELETE error:', err);
    res.status(500).json({ error: 'Erro ao remover produto' });
  }
});

export default router;