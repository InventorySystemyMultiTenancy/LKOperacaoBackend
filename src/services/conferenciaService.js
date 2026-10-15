import { Op } from "sequelize";
import { Movimentacao, Maquina, Loja } from "../models/index.js";
import { calcularConferencia } from "../utils/conferenciaMaquina.js";
import { consultarFechamentoMachinePay } from "./machinePayService.js";

export const TIPO_ARRECADACAO = "Arrecadação";

const comContadores = {
  contadorIn: { [Op.ne]: null },
  contadorOut: { [Op.ne]: null },
};

const numero = (valor) => {
  if (valor === null || valor === undefined || valor === "") return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
};

// Última leitura de relógio da máquina antes de `dataColeta`.
export const buscarLeituraAnterior = (maquinaId, dataColeta, idIgnorar = null) =>
  Movimentacao.findOne({
    where: {
      maquinaId,
      dataColeta: { [Op.lt]: dataColeta },
      ...comContadores,
      ...(idIgnorar ? { id: { [Op.ne]: idIgnorar } } : {}),
    },
    order: [["dataColeta", "DESC"]],
  });

// Soma o que entrou entre a leitura anterior (exclusive) e a atual (inclusive).
// Cada movimentação guarda o digital/dinheiro desde a movimentação anterior,
// então a soma cobre exatamente o período entre as duas leituras de relógio.
export async function somarPeriodo(maquina, de, ate) {
  const movimentacoes = await Movimentacao.findAll({
    where: {
      maquinaId: maquina.id,
      dataColeta: de ? { [Op.gt]: de, [Op.lte]: ate } : { [Op.lte]: ate },
    },
    attributes: [
      "valorEntradaCartao",
      "valorEntradaNotas",
      "valorEntradaFichas",
      "statusFinanceiro",
      "sairam",
      "retiradaEstoque",
      "tipoOcorrencia",
    ],
  });

  let digital = 0;
  let digitalPendente = false;
  let fisico = 0;
  let fisicoPendente = false;
  let temFisico = false;
  let premiosEstoque = 0;
  // Coleta feita pelo Controle de Arrecadação não conta pelúcias no estoque
  let semContagemEstoque = false;

  for (const mov of movimentacoes) {
    const cartao = numero(mov.valorEntradaCartao);
    if (cartao === null) {
      if (maquina.machinePayPosId) digitalPendente = true;
    } else {
      digital += cartao;
    }

    const notas = numero(mov.valorEntradaNotas);
    const fichas = numero(mov.valorEntradaFichas);
    if (mov.statusFinanceiro === "pendente") fisicoPendente = true;
    if (notas !== null || fichas !== null) {
      temFisico = true;
      fisico += (notas || 0) + (fichas || 0);
    }

    if (mov.tipoOcorrencia === TIPO_ARRECADACAO) semContagemEstoque = true;
    if (!mov.retiradaEstoque) premiosEstoque += numero(mov.sairam) || 0;
  }

  return {
    digital,
    digitalPendente,
    fisicoContado: temFisico && !fisicoPendente ? fisico : null,
    premiosEstoque: movimentacoes.length && !semContagemEstoque ? premiosEstoque : null,
  };
}

// Recalcula e grava a conferência de uma movimentação. Nunca lança erro:
// a conferência é informativa e não pode atrapalhar o registro da coleta.
export async function atualizarConferenciaMovimentacao(movimentacaoId) {
  try {
    const movimentacao = await Movimentacao.findByPk(movimentacaoId);
    if (!movimentacao) return null;

    const maquina = await Maquina.findByPk(movimentacao.maquinaId);
    if (!maquina) return null;

    if (movimentacao.contadorIn === null || movimentacao.contadorOut === null) {
      await Movimentacao.update(
        { conferencia: null, nivelConferencia: null },
        { where: { id: movimentacao.id }, hooks: false },
      );
      return null;
    }

    const anterior = await buscarLeituraAnterior(
      maquina.id,
      movimentacao.dataColeta,
      movimentacao.id,
    );
    const periodo = await somarPeriodo(
      maquina,
      anterior?.dataColeta || null,
      movimentacao.dataColeta,
    );

    const conferencia = calcularConferencia({
      maquina,
      anterior,
      atual: movimentacao,
      periodo: anterior ? periodo : {},
    });

    await Movimentacao.update(
      { conferencia, nivelConferencia: conferencia.nivel },
      { where: { id: movimentacao.id }, hooks: false },
    );
    return conferencia;
  } catch (error) {
    console.error("[Conferência] Falha ao calcular:", error.message);
    return null;
  }
}

// Ao editar uma leitura, a próxima leitura da máquina também muda (é a base dela).
export async function atualizarConferenciaComProxima(movimentacaoId) {
  const conferencia = await atualizarConferenciaMovimentacao(movimentacaoId);
  try {
    const movimentacao = await Movimentacao.findByPk(movimentacaoId, {
      attributes: ["id", "maquinaId", "dataColeta"],
    });
    if (movimentacao) {
      const proxima = await Movimentacao.findOne({
        where: {
          maquinaId: movimentacao.maquinaId,
          dataColeta: { [Op.gt]: movimentacao.dataColeta },
          ...comContadores,
        },
        order: [["dataColeta", "ASC"]],
        attributes: ["id"],
      });
      if (proxima) await atualizarConferenciaMovimentacao(proxima.id);
    }
  } catch (error) {
    console.error("[Conferência] Falha ao recalcular a próxima:", error.message);
  }
  return conferencia;
}

// Prévia antes de salvar: com os contadores lidos (foto ou digitados) mostra
// na hora quanto deveria ter de dinheiro físico e quantos prêmios deveriam ter
// saído. O digital vem ao vivo da Machine Pay desde a última leitura.
export async function calcularPreviaConferencia({ maquinaId, contadorIn, contadorOut }) {
  const maquina = await Maquina.findByPk(maquinaId);
  if (!maquina) {
    const erro = new Error("Máquina não encontrada");
    erro.status = 404;
    throw erro;
  }

  const agora = new Date();
  const anterior = await buscarLeituraAnterior(maquina.id, agora);
  let periodo = {};
  let machinePay = null;

  if (anterior) {
    periodo = await somarPeriodo(maquina, anterior.dataColeta, agora);
    // A coleta ainda não foi salva: o dinheiro dela não foi contado.
    periodo.fisicoContado = null;

    if (maquina.machinePayPosId) {
      try {
        const fechamento = await consultarFechamentoMachinePay({
          posId: maquina.machinePayPosId,
          inicio: anterior.dataColeta,
          fim: agora,
        });
        periodo.digital = fechamento.cartaoPix;
        periodo.digitalPendente = false;
        machinePay = { sucesso: true, valor: fechamento.cartaoPix };
      } catch (error) {
        machinePay = { sucesso: false, erro: error.message };
      }
    }
  }

  const conferencia = calcularConferencia({
    maquina,
    anterior,
    atual: { contadorIn, contadorOut, dataColeta: agora },
    periodo,
  });

  return { conferencia, machinePay };
}

// Painel de conferência: última leitura conferida de cada máquina ativa.
export async function listarConferenciasMaquinas({ lojaId } = {}) {
  const maquinas = await Maquina.findAll({
    where: { ativo: true, ...(lojaId ? { lojaId } : {}) },
    attributes: [
      "id",
      "codigo",
      "nome",
      "lojaId",
      "valorPulso",
      "valorJogada",
      "valorFicha",
      "fichasNecessarias",
      "jogadasPorPremio",
      "machinePayPosId",
    ],
    include: [{ model: Loja, as: "loja", attributes: ["id", "nome"] }],
    order: [["codigo", "ASC"]],
  });

  const resultado = [];
  for (const maquina of maquinas) {
    const ultima = await Movimentacao.findOne({
      where: { maquinaId: maquina.id, ...comContadores },
      order: [["dataColeta", "DESC"]],
      attributes: [
        "id",
        "dataColeta",
        "contadorIn",
        "contadorOut",
        "conferencia",
        "nivelConferencia",
      ],
    });

    resultado.push({
      maquina: {
        id: maquina.id,
        codigo: maquina.codigo,
        nome: maquina.nome,
        loja: maquina.loja ? { id: maquina.loja.id, nome: maquina.loja.nome } : null,
        configurada: Boolean(
          maquina.jogadasPorPremio &&
            (maquina.valorJogada || (maquina.valorFicha && maquina.fichasNecessarias)),
        ),
        machinePay: Boolean(maquina.machinePayPosId),
      },
      ultimaLeitura: ultima
        ? {
            movimentacaoId: ultima.id,
            dataColeta: ultima.dataColeta,
            contadorIn: ultima.contadorIn,
            contadorOut: ultima.contadorOut,
          }
        : null,
      conferencia: ultima?.conferencia || null,
      nivel: ultima?.nivelConferencia || null,
    });
  }

  const ordem = { URGENTE: 0, LEVE: 1, OK: 2 };
  resultado.sort(
    (a, b) => (ordem[a.nivel] ?? 3) - (ordem[b.nivel] ?? 3),
  );

  return {
    maquinas: resultado,
    totais: {
      urgentes: resultado.filter((r) => r.nivel === "URGENTE").length,
      leves: resultado.filter((r) => r.nivel === "LEVE").length,
      ok: resultado.filter((r) => r.nivel === "OK").length,
      semLeitura: resultado.filter((r) => !r.ultimaLeitura).length,
      semConfiguracao: resultado.filter((r) => !r.maquina.configurada).length,
    },
  };
}

// Histórico de conferências de uma máquina (mais recentes primeiro).
export async function listarHistoricoConferencias(maquinaId, limite = 30) {
  return Movimentacao.findAll({
    where: { maquinaId, ...comContadores },
    order: [["dataColeta", "DESC"]],
    limit: limite,
    attributes: [
      "id",
      "dataColeta",
      "contadorIn",
      "contadorOut",
      "conferencia",
      "nivelConferencia",
      "leituraFoto",
    ],
  });
}
