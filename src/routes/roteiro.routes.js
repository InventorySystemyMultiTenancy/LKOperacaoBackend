import express from "express";
import {
  listarRoteiros,
  gerarRoteiros,
  criarRoteiroCoringa,
  obterRoteiro,
  listarLojasDoRoteiro,
  iniciarRoteiro,
  concluirLoja,
  concluirRoteiro,
  atualizarRoteiro,
  deletarRoteiro,
  deletarTodosRoteiros,
  adicionarLoja,
  removerLoja,
  moverLoja,
  marcarLojaAReceber,
  listarLojasAReceberPendentes,
  receberLojaAReceber,
  salvarTemplate,
  adicionarGasto,
  listarGastos,
  atualizarGasto,
  calcularComissaoLoja,
  listarRoteirosPendentesDia,
  listarManutencoes,
  excluirManutencao,
  atualizarManutencao,
  listarGastosPorLoja,
  removerLojaDeRoteiros,
  listarAlertasRoteirosFinalizadosIncompletos,
} from "../controllers/roteiroController.js";

export { listarGastosPorLoja };
import {
  autenticar,
  autenticarOuIgnorar,
  autorizarRole,
} from "../middlewares/auth.js";
import { cacheGet, clearHttpCacheOnSuccess } from "../middlewares/httpCache.js";
import {
  salvarLocalizacaoRoteiro,
  encerrarLocalizacaoRoteiro,
  listarLocalizacoesAtivas,
  obterStatusMinhaLocalizacaoRoteiro,
} from "../controllers/roteiroLocalizacaoController.js";

const router = express.Router();
// GET /api/gastos?lojaId=... - Lista gastos por loja
router.get("/gastos", listarGastosPorLoja);
// DELETE /api/manutencoes/:id - Excluir manutenção
router.delete("/manutencoes/:id", clearHttpCacheOnSuccess(), excluirManutencao);
// PUT /api/manutencoes/:id - Atualizar manutenção (vincular funcionário, status, etc)
router.put(
  "/manutencoes/:id",
  autenticar,
  autorizarRole("ADMIN", "FUNCIONARIO"),
  clearHttpCacheOnSuccess(),
  atualizarManutencao,
);
// GET /api/manutencoes - Lista todas as manutenções
router.get("/manutencoes", listarManutencoes);
// GET /api/roteiros/pendentes-dia - Roteiros pendentes do dia da semana atual
router.get("/pendentes-dia", listarRoteirosPendentesDia);

// Todas as rotas requerem autenticação
router.post("/:roteiroId/localizacao", autenticarOuIgnorar, clearHttpCacheOnSuccess(), salvarLocalizacaoRoteiro);

router.use(autenticar);

// GET /api/roteiros - Lista todos os roteiros (filtrar por data opcional)
router.get("/", cacheGet({ ttlSeconds: 20 }), listarRoteiros);

// GET /api/roteiros/alertas/finalizados-incompletos - Alertas para ADMIN
router.get(
  "/alertas/finalizados-incompletos",
  cacheGet({ ttlSeconds: 20 }),
  listarAlertasRoteirosFinalizadosIncompletos
);

// GET /api/roteiros/localizacoes-ativas
router.get("/localizacoes-ativas", listarLocalizacoesAtivas);

// POST /api/roteiros/gerar - Gera 6 roteiros diários automáticos
router.post("/gerar", clearHttpCacheOnSuccess(), gerarRoteiros);

// POST /api/roteiros/coringa - Cria o Roteiro Coringa (criação única, persiste e é resetado semanalmente)
router.post("/coringa", clearHttpCacheOnSuccess(), criarRoteiroCoringa);

// POST /api/roteiros/mover-loja - Move loja entre roteiros
router.post("/mover-loja", clearHttpCacheOnSuccess(), moverLoja);

// DELETE /api/roteiros/todos - Deletar todos os roteiros (pendentes ou com force=true)
router.delete("/todos", clearHttpCacheOnSuccess(), deletarTodosRoteiros);

// POST /api/roteiros/lojas/:lojaId/calcular-comissao - Calcular comissão de uma loja
// IMPORTANTE: Esta rota precisa estar ANTES de /:id para não ser capturada por ela

// POST para calcular comissão
router.post("/lojas/:lojaId/calcular-comissao", async (req, res) => {
  try {
    const { lojaId } = req.params;
    const { roteiroId } = req.body;
    const resultado = await calcularComissaoLoja(lojaId, roteiroId);
    if (!resultado) {
      return res.status(404).json({ error: "Nenhuma máquina com comissão configurada nesta loja" });
    }
    res.json(resultado);
  } catch (error) {
    console.error("Erro ao calcular comissão:", error);
    res.status(500).json({ error: "Erro ao calcular comissão" });
  }
});

// GET para consultar comissão
router.get("/lojas/:lojaId/comissao", async (req, res) => {
  try {
    const { lojaId } = req.params;
    const roteiroId = req.query.roteiroId;
    if (!roteiroId) {
      return res.status(400).json({ error: "roteiroId é obrigatório" });
    }
    const comissao = await calcularComissaoLoja(lojaId, roteiroId);
    if (!comissao) {
      return res.status(404).json({ error: "Nenhuma máquina com comissão configurada nesta loja" });
    }
    res.json(comissao);
  } catch (error) {
    console.error("Erro ao consultar comissão:", error);
    res.status(500).json({ error: "Erro ao consultar comissão" });
  }
});

// GET /api/roteiros/:id - Busca detalhes completos de um roteiro específico
router.get("/:id", obterRoteiro);

// GET /api/roteiros/:roteiroId/lojas - Lista lojas de um roteiro específico
router.get("/:roteiroId/lojas", listarLojasDoRoteiro);

// DELETE /api/roteiros/:roteiroId/localizacao
router.get("/:roteiroId/localizacao/status", obterStatusMinhaLocalizacaoRoteiro);

router.delete("/:roteiroId/localizacao", clearHttpCacheOnSuccess(), encerrarLocalizacaoRoteiro);

// PUT /api/roteiros/:id - Atualizar informações do roteiro
router.put("/:id", clearHttpCacheOnSuccess(), atualizarRoteiro);

// DELETE /api/roteiros/:id - Deletar um roteiro
router.delete("/:id", clearHttpCacheOnSuccess(), deletarRoteiro);

// POST /api/roteiros/:id/iniciar - Inicia um roteiro
router.post("/:id/iniciar", clearHttpCacheOnSuccess(), iniciarRoteiro);

// POST /api/roteiros/:roteiroId/lojas/:lojaId/concluir - Marca uma loja como concluída
router.post("/:roteiroId/lojas/:lojaId/concluir", clearHttpCacheOnSuccess(), concluirLoja);

// POST /api/roteiros/:roteiroId/lojas/:lojaId/areceber - Marca loja como à receber
router.post("/:roteiroId/lojas/:lojaId/areceber", clearHttpCacheOnSuccess(), marcarLojaAReceber);

// POST /api/roteiros/:id/concluir - Finaliza o roteiro completo

// POST /api/roteiros/:id/desfazer-finalizacao - Desfaz a finalização do roteiro
import { desfazerFinalizacaoRoteiro } from "../controllers/roteiroController.js";
router.post("/:id/desfazer-finalizacao", clearHttpCacheOnSuccess(), desfazerFinalizacaoRoteiro);

router.post("/:id/concluir", clearHttpCacheOnSuccess(), concluirRoteiro);

// POST /api/roteiros/:id/gastos - Adicionar gasto ao roteiro
router.post("/:id/gastos", clearHttpCacheOnSuccess(), adicionarGasto);

// GET /api/roteiros/:id/gastos - Listar gastos do roteiro
router.get("/:id/gastos", listarGastos);


// POST /api/roteiros/:id/manutencoes - Registrar manutenção necessária em uma máquina de uma loja do roteiro
import { registrarManutencao } from "../controllers/roteiroController.js";
router.post("/:id/manutencoes", clearHttpCacheOnSuccess(), registrarManutencao);

// PUT /api/roteiros/:roteiroId/gastos/:gastoId - Atualizar gasto do roteiro
router.put("/:roteiroId/gastos/:gastoId", clearHttpCacheOnSuccess(), atualizarGasto);

// POST /api/roteiros/:roteiroId/lojas - Adicionar loja ao roteiro
router.post("/:roteiroId/lojas", clearHttpCacheOnSuccess(), adicionarLoja);

// DELETE /api/roteiros/:roteiroId/lojas/:lojaId - Remover loja do roteiro
router.delete("/:roteiroId/lojas/:lojaId", clearHttpCacheOnSuccess(), removerLoja);

// POST /api/roteiros/:roteiroId/lojas/reordenar - Reordenar lojas no roteiro
// Remover loja de todos os roteiros
router.delete("/remover-loja/:lojaId", clearHttpCacheOnSuccess(), removerLojaDeRoteiros);

// Financeiro - à receber
router.get("/financeiro/areceber", listarLojasAReceberPendentes);
router.put("/financeiro/areceber/:id/receber", clearHttpCacheOnSuccess(), receberLojaAReceber);

export default router;
