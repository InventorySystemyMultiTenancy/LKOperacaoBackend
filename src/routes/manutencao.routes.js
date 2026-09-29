import express from "express";
import {
  listarManutencoes,
  excluirManutencao,
  atualizarManutencao,
  registrarManutencaoSemRoteiro,
} from "../controllers/roteiroController.js";
import { autenticar, autorizarRole } from "../middlewares/auth.js";

const router = express.Router();


// POST /api/manutencoes - Registrar manutenção sem roteiro
router.post("/", registrarManutencaoSemRoteiro);
// GET /api/manutencoes - Lista todas as manutenções
router.get("/", listarManutencoes);
// PUT /api/manutencoes/:id - Atualizar manutenção
router.put(
  "/:id",
  autenticar,
  autorizarRole("ADMIN", "FUNCIONARIO"),
  atualizarManutencao,
);
// DELETE /api/manutencoes/:id - Excluir manutenção
router.delete("/:id", excluirManutencao);

export default router;
