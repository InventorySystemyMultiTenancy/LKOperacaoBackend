import express from "express";
import alertasResolvidosController from "../controllers/alertasResolvidosController.js";
import { autenticar } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", autenticar, alertasResolvidosController.listar);
router.post("/", autenticar, alertasResolvidosController.resolver);

export default router;
