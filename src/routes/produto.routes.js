import express from "express";
import {
  listarProdutos,
  obterProduto,
  criarProduto,
  atualizarProduto,
  deletarProduto,
  listarCategorias,
} from "../controllers/produtoController.js";
import {
  autenticar,
  autorizarRole,
  registrarLog,
} from "../middlewares/auth.js";
import { cacheGet, clearHttpCacheOnSuccess } from "../middlewares/httpCache.js";

const router = express.Router();

router.get("/", autenticar, cacheGet({ ttlSeconds: 60 }), listarProdutos);
router.get("/categorias", autenticar, cacheGet({ ttlSeconds: 120 }), listarCategorias);
router.get("/:id", autenticar, obterProduto);
router.post(
  "/",
  autenticar,
  autorizarRole("ADMIN"),
  clearHttpCacheOnSuccess(),
  registrarLog("CRIAR_PRODUTO", "Produto"),
  criarProduto
);
router.put(
  "/:id",
  autenticar,
  autorizarRole("ADMIN"),
  clearHttpCacheOnSuccess(),
  registrarLog("EDITAR_PRODUTO", "Produto"),
  atualizarProduto
);
router.delete(
  "/:id",
  autenticar,
  autorizarRole("ADMIN"),
  clearHttpCacheOnSuccess(),
  registrarLog("DELETAR_PRODUTO", "Produto"),
  deletarProduto
);

export default router;
