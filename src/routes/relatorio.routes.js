
import express from "express";
import {
  balançoSemanal,
  alertasEstoque,
  performanceMaquinas,
  relatorioImpressao,
  relatorioComissoes,
  relatorioRoteiro,
} from "../controllers/relatorioController.js";
import { autenticar, autorizarPermissao } from "../middlewares/auth.js";
import { cacheGet } from "../middlewares/httpCache.js";
import { resultadoPorLoja } from "../services/resultadoLojasService.js";

const router = express.Router();

// Resultado por loja: receita, custo das pelúcias (custo das compras),
// comissão e lucro líquido. Usado em Financeiro, Relatórios e Gráficos.
router.get(
  "/resultado-lojas",
  autenticar,
  autorizarPermissao(["financeiro", "relatorios", "graficos"], "ADMIN", "FINANCEIRO"),
  async (req, res) => {
    try {
      res.json(await resultadoPorLoja(req.query));
    } catch (error) {
      console.error("[Relatórios] Erro no resultado por loja:", error);
      res.status(500).json({ error: "Erro ao calcular o resultado por loja" });
    }
  },
);
router.get(
  "/roteiro",
  autenticar,
  autorizarPermissao("relatorios", "ADMIN"),
  cacheGet({ ttlSeconds: 20 }),
  relatorioRoteiro
);

// Todas as rotas de relatórios são restritas a ADMIN
router.get(
  "/balanco-semanal",
  autenticar,
  autorizarPermissao(["relatorios", "graficos", "dashboard.resumo", "dashboard.distribuicaoLojas"], "ADMIN"),
  cacheGet({ ttlSeconds: 20 }),
  balançoSemanal
);
router.get(
  "/alertas-estoque",
  autenticar,
  autorizarPermissao(["relatorios", "alertasEstoque", "dashboard.resumo", "dashboard.alertasMaquinas"], "ADMIN"),
  cacheGet({ ttlSeconds: 20 }),
  alertasEstoque
);
router.get(
  "/performance-maquinas",
  autenticar,
  autorizarPermissao(["relatorios", "graficos"], "ADMIN"),
  cacheGet({ ttlSeconds: 20 }),
  performanceMaquinas
);
router.get(
  "/impressao",
  autenticar,
  autorizarPermissao("relatorios", "ADMIN"),
  cacheGet({ ttlSeconds: 15 }),
  relatorioImpressao
);
router.get(
  "/comissoes",
  autenticar,
  autorizarPermissao("relatorios", "ADMIN"),
  cacheGet({ ttlSeconds: 20 }),
  relatorioComissoes
);

export default router;
