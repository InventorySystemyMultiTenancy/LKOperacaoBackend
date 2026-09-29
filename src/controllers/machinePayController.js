import { Maquina } from "../models/index.js";
import {
  consultarFechamentoMachinePay,
  consultarStatusMaquina,
  creditarSaldoManual,
  solicitarDevolucao,
  MachinePayServiceError,
} from "../services/machinePayService.js";

const responderErroMachinePay = (res, error, mensagemPadrao) => {
  console.error(`[MachinePay] ${mensagemPadrao}:`, error.message);
  if (error instanceof MachinePayServiceError) {
    return res.status(error.status).json({ error: error.message });
  }
  return res
    .status(502)
    .json({ error: mensagemPadrao, details: error.message });
};

// GET /api/machine-pay/maquinas/:id/extrato?dataInicio=&dataFim=
export const obterExtratoMaquina = async (req, res) => {
  try {
    const { id } = req.params;
    const { dataInicio, dataFim } = req.query;

    if (!dataInicio || !dataFim) {
      return res
        .status(400)
        .json({ error: "dataInicio e dataFim são obrigatórios" });
    }

    const maquina = await Maquina.findByPk(id);
    if (!maquina) {
      return res.status(404).json({ error: "Máquina não encontrada" });
    }
    if (!maquina.machinePayPosId) {
      return res
        .status(400)
        .json({ error: "Máquina não possui posId da Machine Pay configurado" });
    }

    const fechamento = await consultarFechamentoMachinePay({
      posId: maquina.machinePayPosId,
      inicio: new Date(dataInicio),
      fim: new Date(dataFim),
    });

    res.json(fechamento);
  } catch (error) {
    responderErroMachinePay(res, error, "Erro ao consultar extrato na Machine Pay");
  }
};

// GET /api/machine-pay/maquinas/:id/status
export const obterStatusMaquina = async (req, res) => {
  try {
    const { id } = req.params;
    const maquina = await Maquina.findByPk(id);
    if (!maquina) {
      return res.status(404).json({ error: "Máquina não encontrada" });
    }
    if (!maquina.machinePayPosId) {
      return res
        .status(400)
        .json({ error: "Máquina não possui posId da Machine Pay configurado" });
    }
    if (!maquina.machinePayUsrId) {
      return res.status(400).json({
        error:
          "Máquina não possui usrId da Machine Pay configurado (necessário para status online/offline)",
      });
    }

    const status = await consultarStatusMaquina({
      posId: maquina.machinePayPosId,
      usrId: maquina.machinePayUsrId,
    });

    res.json(status);
  } catch (error) {
    responderErroMachinePay(res, error, "Erro ao consultar status na Machine Pay");
  }
};

// POST /api/machine-pay/maquinas/:id/credito  { creditos }
export const creditarSaldoMaquina = async (req, res) => {
  try {
    const { id } = req.params;
    const { creditos } = req.body;

    if (!creditos || Number(creditos) <= 0) {
      return res
        .status(400)
        .json({ error: "creditos deve ser um número maior que zero" });
    }

    const maquina = await Maquina.findByPk(id);
    if (!maquina) {
      return res.status(404).json({ error: "Máquina não encontrada" });
    }
    if (!maquina.machinePayPosId) {
      return res
        .status(400)
        .json({ error: "Máquina não possui posId da Machine Pay configurado" });
    }

    const resultado = await creditarSaldoManual({
      posId: maquina.machinePayPosId,
      creditos,
    });

    res.locals.entityId = maquina.id;
    res.json(resultado);
  } catch (error) {
    responderErroMachinePay(res, error, "Erro ao creditar saldo na Machine Pay");
  }
};

// POST /api/machine-pay/maquinas/:id/devolucao  { idwebhook }
export const devolverPagamentoMaquina = async (req, res) => {
  try {
    const { id } = req.params;
    const { idwebhook } = req.body;

    if (!idwebhook) {
      return res.status(400).json({ error: "idwebhook é obrigatório" });
    }

    const maquina = await Maquina.findByPk(id);
    if (!maquina) {
      return res.status(404).json({ error: "Máquina não encontrada" });
    }

    const resultado = await solicitarDevolucao({ idwebhook });

    res.locals.entityId = maquina.id;
    res.json(resultado);
  } catch (error) {
    responderErroMachinePay(
      res,
      error,
      "Erro ao solicitar devolução na Machine Pay",
    );
  }
};
