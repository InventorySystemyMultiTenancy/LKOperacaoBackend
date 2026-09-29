import express from "express";
import {
  obterExtratoMaquina,
  obterStatusMaquina,
  creditarSaldoMaquina,
  devolverPagamentoMaquina,
} from "../controllers/machinePayController.js";
import {
  autenticar,
  autorizarRole,
  registrarLog,
} from "../middlewares/auth.js";

const router = express.Router();

router.get(
  "/maquinas/:id/status",
  autenticar,
  autorizarRole("ADMIN", "FINANCEIRO"),
  obterStatusMaquina,
);
router.get(
  "/maquinas/:id/extrato",
  autenticar,
  autorizarRole("ADMIN", "FINANCEIRO"),
  obterExtratoMaquina,
);
router.post(
  "/maquinas/:id/credito",
  autenticar,
  autorizarRole("ADMIN"),
  registrarLog("CREDITAR_SALDO_MACHINE_PAY", "Maquina"),
  creditarSaldoMaquina,
);
router.post(
  "/maquinas/:id/devolucao",
  autenticar,
  autorizarRole("ADMIN"),
  registrarLog("SOLICITAR_DEVOLUCAO_MACHINE_PAY", "Maquina"),
  devolverPagamentoMaquina,
);

export default router;
