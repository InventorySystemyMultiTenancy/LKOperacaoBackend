import express from "express";
import {
  obterExtratoMaquina,
  obterStatusMaquina,
  creditarSaldoMaquina,
  devolverPagamentoMaquina,
} from "../controllers/machinePayController.js";
import {
  obterResumo,
  listarMaquinasMonitor,
  rankingQuedas,
  serieDiaria,
  detalharMaquinaMonitor,
  listarEventos,
  coletarAgora,
  listarVendasMaquinaMonitor,
  enviarCreditoMaquinaMonitor,
  devolverPagamentoMonitor,
  salvarHorarioMonitor,
  salvarRegiaoMonitor,
  listarLeitoresConta,
} from "../controllers/machinePayMonitorController.js";
import {
  autenticar,
  autorizarRole,
  registrarLog,
  autorizarPermissao,
} from "../middlewares/auth.js";
import { temPermissao } from "../utils/permissoes.js";

const router = express.Router();

// ---- Monitoramento dos leitores (página "Machine Pay") ----

// Campos em R$ das respostas do monitor (quantidades continuam visíveis)
const CAMPOS_VALOR = new Set([
  "vendasHojeValor",
  "totalValor",
  "pix",
  "debito",
  "credito",
  "vendasValor",
  "valor",
  "taxa",
  "liquido",
]);

const removerValores = (dado) => {
  if (Array.isArray(dado)) return dado.map(removerValores);
  if (Object.prototype.toString.call(dado) !== "[object Object]") return dado;
  return Object.fromEntries(
    Object.entries(dado)
      .filter(([chave]) => !CAMPOS_VALOR.has(chave))
      .map(([chave, valor]) => [chave, removerValores(valor)]),
  );
};

// Sem "machinePay.valores", os valores em R$ nem saem do servidor
const ocultarValores = (req, res, next) => {
  if (temPermissao(req.usuario, "machinePay.valores", ["ADMIN", "FINANCEIRO"])) {
    return next();
  }
  const json = res.json.bind(res);
  res.json = (corpo) => json(removerValores(corpo));
  next();
};

const acessoMonitor = [
  autenticar,
  autorizarPermissao("machinePay", "ADMIN", "FINANCEIRO"),
  ocultarValores,
];
router.get("/monitor/resumo", ...acessoMonitor, obterResumo);
router.get("/monitor/maquinas", ...acessoMonitor, listarMaquinasMonitor);
router.get("/monitor/maquinas/:posId", ...acessoMonitor, detalharMaquinaMonitor);
router.get("/monitor/ranking-quedas", ...acessoMonitor, rankingQuedas);
router.get("/monitor/serie-diaria", ...acessoMonitor, serieDiaria);
router.get("/monitor/eventos", ...acessoMonitor, listarEventos);
router.post("/monitor/coletar", ...acessoMonitor, coletarAgora);
router.get("/conta/leitores", ...acessoMonitor, listarLeitoresConta);

// Ações abertas pelo nome da máquina na página Machine Pay
router.get(
  "/monitor/maquinas/:posId/vendas",
  ...acessoMonitor,
  autorizarPermissao("machinePay.extrato", "ADMIN", "FINANCEIRO"),
  listarVendasMaquinaMonitor,
);
router.post(
  "/monitor/maquinas/:posId/credito",
  ...acessoMonitor,
  autorizarPermissao("machinePay.creditoRemoto", "ADMIN"),
  registrarLog("CREDITO_REMOTO_MACHINE_PAY", "MachinePay"),
  enviarCreditoMaquinaMonitor,
);
router.put(
  "/monitor/maquinas/:posId/horario",
  ...acessoMonitor,
  autorizarPermissao("machinePay.horario", "ADMIN"),
  registrarLog("HORARIO_FUNCIONAMENTO_MACHINE_PAY", "MachinePay"),
  salvarHorarioMonitor,
);
router.put(
  "/monitor/maquinas/:posId/regiao",
  ...acessoMonitor,
  autorizarPermissao("machinePay.horario", "ADMIN"),
  registrarLog("REGIAO_MACHINE_PAY", "MachinePay"),
  salvarRegiaoMonitor,
);
router.post(
  "/monitor/maquinas/:posId/devolucao",
  ...acessoMonitor,
  autorizarPermissao("machinePay.devolucao", "ADMIN"),
  registrarLog("DEVOLUCAO_PAGAMENTO_MACHINE_PAY", "MachinePay"),
  devolverPagamentoMonitor,
);

router.get(
  "/maquinas/:id/status",
  autenticar,
  autorizarPermissao("maquinas.machinePay", "ADMIN", "FINANCEIRO"),
  obterStatusMaquina,
);
router.get(
  "/maquinas/:id/extrato",
  autenticar,
  autorizarPermissao("maquinas.machinePay", "ADMIN", "FINANCEIRO"),
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
