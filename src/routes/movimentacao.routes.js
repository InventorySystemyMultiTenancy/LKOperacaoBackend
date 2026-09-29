import express from "express";
import {
  registrarMovimentacao,
  listarMovimentacoes,
  obterMovimentacao,
  atualizarMovimentacao,
  deletarMovimentacao,
  listarPendentesFinanceiro,
  atualizarValoresFinanceiros,
  buscarValorDigitalMachinePay,
} from "../controllers/movimentacaoController.js";
import {
  autenticar,
  autorizarRole,
  registrarLog,
} from "../middlewares/auth.js";

const router = express.Router();

router.get("/", autenticar, listarMovimentacoes);
router.get("/pendentes-financeiro", autenticar, listarPendentesFinanceiro);
router.get("/:id", autenticar, obterMovimentacao);
router.post(
  "/",
  autenticar,
  registrarLog("REGISTRAR_MOVIMENTACAO", "Movimentacao"),
  registrarMovimentacao
);
router.put(
  "/:id",
  autenticar,
  registrarLog("EDITAR_MOVIMENTACAO", "Movimentacao"),
  atualizarMovimentacao
);
router.put(
  "/:id/financeiro",
  autenticar,
  registrarLog("ATUALIZAR_VALORES_FINANCEIROS", "Movimentacao"),
  atualizarValoresFinanceiros
);
router.post(
  "/:id/machine-pay/buscar",
  autenticar,
  autorizarRole("ADMIN", "FINANCEIRO"),
  registrarLog("BUSCAR_VALOR_DIGITAL_MACHINE_PAY", "Movimentacao"),
  buscarValorDigitalMachinePay
);
router.delete(
  "/:id",
  autenticar,
  autorizarRole("ADMIN"),
  registrarLog("DELETAR_MOVIMENTACAO", "Movimentacao"),
  deletarMovimentacao
);

export default router;
