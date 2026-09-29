
import express from "express";
import {
  balançoSemanal,
  alertasEstoque,
  performanceMaquinas,
  relatorioImpressao,
  relatorioComissoes,
  relatorioRoteiro,
} from "../controllers/relatorioController.js";
import { autenticar, autorizarRole } from "../middlewares/auth.js";
import { cacheGet } from "../middlewares/httpCache.js";

const router = express.Router();
router.get(
  "/roteiro",
  autenticar,
  autorizarRole("ADMIN"),
  cacheGet({ ttlSeconds: 20 }),
  relatorioRoteiro
);

// Todas as rotas de relatórios são restritas a ADMIN
router.get(
  "/balanco-semanal",
  autenticar,
  autorizarRole("ADMIN"),
  cacheGet({ ttlSeconds: 20 }),
  balançoSemanal
);
router.get(
  "/alertas-estoque",
  autenticar,
  autorizarRole("ADMIN"),
  cacheGet({ ttlSeconds: 20 }),
  alertasEstoque
);
router.get(
  "/performance-maquinas",
  autenticar,
  autorizarRole("ADMIN"),
  cacheGet({ ttlSeconds: 20 }),
  performanceMaquinas
);
router.get(
  "/impressao",
  autenticar,
  autorizarRole("ADMIN"),
  cacheGet({ ttlSeconds: 15 }),
  relatorioImpressao
);
router.get(
  "/comissoes",
  autenticar,
  autorizarRole("ADMIN"),
  cacheGet({ ttlSeconds: 20 }),
  relatorioComissoes
);

export default router;
