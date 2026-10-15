import express from "express";
import alertasFinanceirosController from "../controllers/alertasFinanceirosController.js";
import { autenticar, autorizarPermissao } from "../middlewares/auth.js";

const router = express.Router();

router.get(
  "/",
  autenticar,
  autorizarPermissao(["financeiro", "alertasEstoque"], "ADMIN", "FINANCEIRO"),
  alertasFinanceirosController.listarAlertas
);

export default router;
