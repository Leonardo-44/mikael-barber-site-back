import { sql } from "../config/database.js"; // ✅ usa neon, igual ao resto do projeto

// ── GET /api/despesas?period=day|week|month|custom&from=YYYY-MM-DD&to=YYYY-MM-DD ──
export async function listarDespesas(req, res) {
  try {
    const { period = "day", from: customFrom, to: customTo } = req.query;
    const { from, to } = buildDateRange(period, customFrom, customTo);

    const rows = await sql`
      SELECT id, descricao, valor, quantidade, created_at
      FROM despesas
      WHERE created_at >= ${from.toISOString()} AND created_at <= ${to.toISOString()}
      ORDER BY created_at DESC
    `;

    res.json(rows);
  } catch (err) {
    console.error("Erro ao listar despesas:", err);
    res.status(500).json({ error: "Erro interno ao buscar despesas." });
  }
}

// ── POST /api/despesas ──
export async function criarDespesa(req, res) {
  try {
    const { descricao, valor, quantidade = 1 } = req.body;

    if (!descricao || typeof descricao !== "string" || !descricao.trim()) {
      return res.status(400).json({ error: "Descrição é obrigatória." });
    }

    const valorNum = parseFloat(valor);
    if (isNaN(valorNum) || valorNum <= 0) {
      return res.status(400).json({ error: "Valor deve ser maior que zero." });
    }

    const qtdNum = parseInt(quantidade);
    if (isNaN(qtdNum) || qtdNum < 1) {
      return res.status(400).json({ error: "Quantidade deve ser maior que zero." });
    }

    const rows = await sql`
      INSERT INTO despesas (descricao, valor, quantidade)
      VALUES (${descricao.trim().slice(0, 120)}, ${valorNum}, ${qtdNum})
      RETURNING id, descricao, valor, quantidade, created_at
    `;

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Erro ao criar despesa:", err);
    res.status(500).json({ error: "Erro interno ao salvar despesa." });
  }
}

// ── PUT /api/despesas/:id — atualiza quantidade ──
export async function atualizarDespesa(req, res) {
  try {
    const { id } = req.params;
    const { quantidade } = req.body;

    const qtdNum = parseInt(quantidade);
    if (isNaN(qtdNum) || qtdNum < 1) {
      return res.status(400).json({ error: "Quantidade deve ser maior que zero." });
    }

    const rows = await sql`
      UPDATE despesas SET quantidade = ${qtdNum}
      WHERE id = ${id}
      RETURNING id, descricao, valor, quantidade, created_at
    `;

    if (!rows[0]) return res.status(404).json({ error: "Despesa não encontrada." });

    res.json(rows[0]);
  } catch (err) {
    console.error("Erro ao atualizar despesa:", err);
    res.status(500).json({ error: "Erro interno ao atualizar despesa." });
  }
}

// ── DELETE /api/despesas/:id ──
export async function deletarDespesa(req, res) {
  try {
    const { id } = req.params;

    const rows = await sql`
      DELETE FROM despesas WHERE id = ${id} RETURNING id
    `;

    if (!rows[0]) return res.status(404).json({ error: "Despesa não encontrada." });

    res.status(204).send();
  } catch (err) {
    console.error("Erro ao deletar despesa:", err);
    res.status(500).json({ error: "Erro interno ao deletar despesa." });
  }
}

// ── Helper ──────────────────────────────────
function buildDateRange(period, customFrom, customTo) {
  const now = new Date();

  if (period === "week") {
    const from = new Date(now);
    from.setDate(now.getDate() - now.getDay());
    from.setHours(0, 0, 0, 0);
    const to = new Date(now);
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }

  if (period === "month") {
    const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const to = new Date(now);
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }

  if (period === "custom" && customFrom && customTo) {
    return {
      from: new Date(customFrom + "T00:00:00"),
      to:   new Date(customTo   + "T23:59:59"),
    };
  }

  // fallback: dia atual
  const from = new Date(now);
  from.setHours(0, 0, 0, 0);
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);
  return { from, to };
}