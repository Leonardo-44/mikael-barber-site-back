// ============================================
//  routes/despesas.js — Mikael Barber
// ============================================

import { Router } from "express";
import {
  listarDespesas,
  criarDespesa,
  atualizarDespesa,
  deletarDespesa,
} from "../controllers/despesasController.js";
import { authMiddleware } from "../middlewares/auth.js"; // ✅ nome correto do seu projeto

const router = Router();

router.use(authMiddleware);

router.get("/",       listarDespesas);
router.post("/",      criarDespesa);
router.put("/:id",    atualizarDespesa);  // ✅ nova rota para atualizar quantidade
router.delete("/:id", deletarDespesa);

export default router;