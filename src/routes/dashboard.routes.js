import express from "express";
import { autenticar } from "../middlewares/auth.js";
import { temPermissao } from "../utils/permissoes.js";
import { resumoDashboard } from "../services/dashboardService.js";

const router = express.Router();

// Boxes do topo do Dashboard: valores do mês, manutenções e top máquinas/produtos.
// Valores em R$ só para quem vê o resumo (ADMIN, FINANCEIRO ou permissão).
router.get("/resumo", autenticar, async (req, res) => {
  try {
    const verValores = temPermissao(req.usuario, "dashboard.resumo", ["ADMIN", "FINANCEIRO"]);
    res.json(await resumoDashboard({ usuario: req.usuario, mes: req.query.mes, verValores }));
  } catch (error) {
    console.error("[Dashboard] Erro no resumo:", error);
    res.status(500).json({ error: "Erro ao carregar o resumo do dashboard" });
  }
});

export default router;
