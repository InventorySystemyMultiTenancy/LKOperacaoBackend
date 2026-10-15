import express from "express";
import {
  listarLojas,
  obterLoja,
  criarLoja,
  atualizarLoja,
  deletarLoja,
} from "../controllers/lojaController.js";
import {
  autenticar,
  registrarLog,
  autorizarPermissao,
} from "../middlewares/auth.js";
import { cacheGet, clearHttpCacheOnSuccess } from "../middlewares/httpCache.js";

const router = express.Router();

router.get("/", autenticar, cacheGet({ ttlSeconds: 60 }), listarLojas);
router.get("/:id", autenticar, obterLoja);
router.post(
  "/",
  autenticar,
  autorizarPermissao("lojas.gerenciar", "ADMIN"),
  clearHttpCacheOnSuccess(),
  registrarLog("CRIAR_LOJA", "Loja"),
  criarLoja
);
router.put(
  "/:id",
  autenticar,
  autorizarPermissao("lojas.gerenciar", "ADMIN"),
  clearHttpCacheOnSuccess(),
  registrarLog("EDITAR_LOJA", "Loja"),
  atualizarLoja
);
router.delete(
  "/:id",
  autenticar,
  autorizarPermissao("lojas.gerenciar", "ADMIN"),
  clearHttpCacheOnSuccess(),
  registrarLog("DELETAR_LOJA", "Loja"),
  deletarLoja
);

export default router;
