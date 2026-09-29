import express from "express";
import alertasFinanceirosController from "../controllers/alertasFinanceirosController.js";
import { autenticar, autorizarRole } from "../middlewares/auth.js";

const router = express.Router();

router.get(
  "/",
  autenticar,
  autorizarRole("ADMIN", "FINANCEIRO"),
  alertasFinanceirosController.listarAlertas
);

export default router;
