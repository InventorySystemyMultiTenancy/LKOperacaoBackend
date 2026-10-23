import { Op } from "sequelize";
import {
  sequelize,
  Arrecadacao,
  Loja,
  Maquina,
  Movimentacao,
  MovimentacaoProduto,
  Roteiro,
} from "../models/index.js";
import { calcularArrecadacao } from "../utils/calculoArrecadacao.js";
import { calcularConferencia } from "../utils/conferenciaMaquina.js";
import {
  buscarLeituraAnterior,
  somarPeriodo,
  atualizarConferenciaMovimentacao,
  TIPO_ARRECADACAO,
} from "./conferenciaService.js";
import { consultarFechamentoMachinePay } from "./machinePayService.js";

const erro = (status, message) => Object.assign(new Error(message), { status });

const comContadores = {
  contadorIn: { [Op.ne]: null },
  contadorOut: { [Op.ne]: null },
};

const nomeMaquina = (m) => m.nome || m.codigo;

const ultimaMovimentacao = (maquinaId) =>
  Movimentacao.findOne({
    where: { maquinaId },
    order: [["dataColeta", "DESC"]],
    attributes: ["id", "dataColeta", "totalPos", "contadorIn", "contadorOut"],
  });

// Produto que está na máquina: o da última movimentação com produto
async function produtoAtualDaMaquina(maquinaId, transaction) {
  const ultimo = await MovimentacaoProduto.findOne({
    include: [
      {
        model: Movimentacao,
        attributes: [],
        where: { maquinaId },
        required: true,
      },
    ],
    order: [[Movimentacao, "dataColeta", "DESC"]],
    attributes: ["produtoId"],
    transaction,
  });
  return ultimo?.produtoId || null;
}

// Dados para abrir o formulário de uma loja: comissão, máquinas com a última
// leitura e quem recebeu a última conferência (nome/WhatsApp para sugerir).
export async function prepararArrecadacao(lojaId) {
  const loja = await Loja.findByPk(lojaId, {
    attributes: ["id", "nome", "responsavel", "telefone", "percentualComissao"],
  });
  if (!loja) throw erro(404, "Loja não encontrada");

  const maquinas = await Maquina.findAll({
    where: { lojaId, ativo: true },
    attributes: ["id", "codigo", "nome", "tipo", "machinePayPosId"],
    order: [["codigo", "ASC"]],
  });

  const lista = [];
  for (const maquina of maquinas) {
    const ultimaLeitura = await Movimentacao.findOne({
      where: { maquinaId: maquina.id, ...comContadores },
      order: [["dataColeta", "DESC"]],
      attributes: ["contadorIn", "contadorOut", "dataColeta"],
    });
    const ultima = await ultimaMovimentacao(maquina.id);
    lista.push({
      id: maquina.id,
      codigo: maquina.codigo,
      nome: nomeMaquina(maquina),
      tipo: maquina.tipo,
      machinePay: Boolean(maquina.machinePayPosId),
      ultimaLeitura,
      ultimaColeta: ultima?.dataColeta || null,
    });
  }

  const anterior = await Arrecadacao.findOne({
    where: { lojaId, recebedorNome: { [Op.ne]: null } },
    order: [["createdAt", "DESC"]],
    attributes: ["recebedorNome", "recebedorWhatsapp"],
  });

  return {
    loja: {
      id: loja.id,
      nome: loja.nome,
      responsavel: loja.responsavel,
      telefone: loja.telefone,
      percentualComissao: Number(loja.percentualComissao) || 0,
    },
    maquinas: lista,
    ultimoRecebedor: anterior
      ? { nome: anterior.recebedorNome, whatsapp: anterior.recebedorWhatsapp }
      : { nome: loja.responsavel || null, whatsapp: loja.telefone || null },
  };
}

// Sugestão para uma máquina: cartão e PIX da Machine Pay desde a última
// movimentação; com os relógios lidos, "caiu" (OUT) e o dinheiro, que é o que
// sobra do contador depois de tirar o digital.
export async function previaMaquinaArrecadacao({ maquinaId, contadorIn, contadorOut }) {
  const maquina = await Maquina.findByPk(maquinaId);
  if (!maquina) throw erro(404, "Máquina não encontrada");

  const agora = new Date();
  const ultima = await ultimaMovimentacao(maquina.id);

  let machinePay = null;
  if (maquina.machinePayPosId) {
    if (!ultima) {
      machinePay = {
        sucesso: false,
        erro: "Primeira coleta desta máquina: preencha cartão e PIX manualmente.",
      };
    } else {
      try {
        const f = await consultarFechamentoMachinePay({
          posId: maquina.machinePayPosId,
          inicio: ultima.dataColeta,
          fim: agora,
        });
        const cartao = Number(f.cartao) || 0;
        const pix = Number(f.pix) || 0;
        // Sem divisão no painel, o total digital vai para cartão
        const semDivisao = !cartao && !pix && Number(f.cartaoPix) > 0;
        machinePay = {
          sucesso: true,
          desde: ultima.dataColeta,
          cartao: semDivisao ? Number(f.cartaoPix) : cartao,
          pix,
          total: semDivisao ? Number(f.cartaoPix) : cartao + pix,
        };
      } catch (error) {
        machinePay = { sucesso: false, erro: error.message };
      }
    }
  }

  let conferencia = null;
  const temContadores =
    contadorIn !== null && contadorIn !== undefined && contadorIn !== "" &&
    contadorOut !== null && contadorOut !== undefined && contadorOut !== "";
  if (temContadores) {
    const anterior = await buscarLeituraAnterior(maquina.id, agora);
    let periodo = {};
    if (anterior) {
      // Digital entre a leitura anterior e a última coleta (já salvo) + o
      // trecho novo desde a última coleta (Machine Pay agora).
      periodo = await somarPeriodo(maquina, anterior.dataColeta, agora);
      periodo.fisicoContado = null;
      if (machinePay?.sucesso) {
        periodo.digital = (periodo.digital || 0) + machinePay.total;
        periodo.digitalPendente = false;
      } else if (!maquina.machinePayPosId) {
        periodo.digitalPendente = false;
      }
    }
    conferencia = calcularConferencia({
      maquina,
      anterior,
      atual: { contadorIn, contadorOut, dataColeta: agora },
      periodo,
    });
  }

  const sugestao = {};
  if (machinePay?.sucesso) {
    sugestao.cartao = machinePay.cartao;
    sugestao.pix = machinePay.pix;
  }
  if (conferencia?.status === "CONFERIDA") {
    sugestao.caiu = conferencia.premiosSaida;
    if (conferencia.fisicoEsperado !== null && conferencia.fisicoEsperado !== undefined) {
      sugestao.dinheiro = conferencia.fisicoEsperado;
    }
  }

  return { machinePay, conferencia, sugestao };
}

// Salva a arrecadação e cria uma movimentação por máquina (dinheiro, digital e
// contadores), que alimenta a conferência e o histórico da máquina.
export async function criarArrecadacao({ usuario, dados }) {
  const { lojaId, roteiroId, data, observacao, recebedorNome, recebedorWhatsapp, recebedorVisto } = dados;
  const loja = await Loja.findByPk(lojaId);
  if (!loja) throw erro(404, "Loja não encontrada");
  if (!Array.isArray(dados.itens) || !dados.itens.length) {
    throw erro(400, "Escolha pelo menos uma máquina");
  }

  const maquinas = await Maquina.findAll({
    where: { id: dados.itens.map((i) => i.maquinaId), lojaId },
  });
  const porId = new Map(maquinas.map((m) => [m.id, m]));
  for (const item of dados.itens) {
    if (!porId.has(item.maquinaId)) throw erro(400, "Máquina não pertence a esta loja");
  }
  if (roteiroId && !(await Roteiro.findByPk(roteiroId))) {
    throw erro(404, "Roteiro não encontrado");
  }

  // Comissão vem do cadastro do ponto; só o ADMIN pode ajustar na hora.
  const percentual =
    usuario.role === "ADMIN" && dados.percentualComissao !== undefined
      ? dados.percentualComissao
      : loja.percentualComissao;

  const calculo = calcularArrecadacao(
    dados.itens.map((item) => ({ ...item, maquinaNome: nomeMaquina(porId.get(item.maquinaId)) })),
    percentual,
  );

  const dataColeta = new Date();
  const movimentacoesIds = [];

  const arrecadacao = await sequelize.transaction(async (transaction) => {
    for (const item of calculo.itens) {
      const ultima = await Movimentacao.findOne({
        where: { maquinaId: item.maquinaId },
        order: [["dataColeta", "DESC"]],
        attributes: ["totalPos"],
        transaction,
      });
      const estoque = Number(ultima?.totalPos) || 0;
      // "Caiu" = prêmios que saíram: baixa do estoque da máquina e vira saída
      // do produto que está nela (o último usado), para o custo da loja.
      const sairam = Math.max(0, Number(item.caiu) || 0);
      const produtoAtual = sairam ? await produtoAtualDaMaquina(item.maquinaId, transaction) : null;
      const mov = await Movimentacao.create(
        {
          maquinaId: item.maquinaId,
          usuarioId: usuario.id,
          lojaId,
          roteiroId: roteiroId || null,
          dataColeta,
          totalPre: Math.max(0, estoque - sairam),
          sairam,
          abastecidas: 0,
          fichas: 0,
          contadorIn: item.contadorIn,
          contadorOut: item.contadorOut,
          valorEntradaNotas: item.dinheiro + item.moeda,
          valorEntradaFichas: item.fichas,
          valorEntradaCartao: item.cartao + item.pix,
          valorFaturado: item.total,
          statusFinanceiro: "concluido",
          tipoOcorrencia: TIPO_ARRECADACAO,
          observacoes: [`Controle de Arrecadação (caiu: ${item.caiu})`, observacao]
            .filter(Boolean)
            .join(" — "),
          leituraFoto: dados.itens.find((i) => i.maquinaId === item.maquinaId)?.leituraFoto || null,
        },
        { transaction },
      );
      if (produtoAtual && sairam) {
        await MovimentacaoProduto.create(
          {
            movimentacaoId: mov.id,
            produtoId: produtoAtual,
            quantidadeSaiu: sairam,
            quantidadeAbastecida: 0,
          },
          { transaction },
        );
      }
      item.movimentacaoId = mov.id;
      movimentacoesIds.push(mov.id);
    }

    return Arrecadacao.create(
      {
        lojaId,
        roteiroId: roteiroId || null,
        usuarioId: usuario.id,
        responsavelNome: usuario.nome || null,
        data: /^\d{4}-\d{2}-\d{2}$/.test(data || "") ? data : dataColeta.toISOString().slice(0, 10),
        itens: calculo.itens,
        totais: calculo.totais,
        valorBruto: calculo.valorBruto,
        percentualComissao: calculo.percentualComissao,
        valorComissao: calculo.valorComissao,
        valorLiquido: calculo.valorLiquido,
        observacao: observacao || null,
        recebedorNome: recebedorNome?.trim() || null,
        recebedorWhatsapp: String(recebedorWhatsapp || "").replace(/\D/g, "").slice(0, 20) || null,
        recebedorVisto: typeof recebedorVisto === "string" && recebedorVisto.startsWith("data:image/")
          ? recebedorVisto
          : null,
      },
      { transaction },
    );
  });

  // Fora da transação: conferência de cada máquina e progresso do roteiro
  for (const id of movimentacoesIds) await atualizarConferenciaMovimentacao(id);
  if (roteiroId) {
    const maquinasConcluidas = await Movimentacao.count({
      where: { roteiroId },
      distinct: true,
      col: "maquinaId",
    });
    await Roteiro.update({ maquinasConcluidas }, { where: { id: roteiroId } });
  }

  return obterArrecadacao(arrecadacao.id);
}

export async function obterArrecadacao(id) {
  const arrecadacao = await Arrecadacao.findByPk(id, {
    include: [{ model: Loja, as: "loja", attributes: ["id", "nome"] }],
  });
  if (!arrecadacao) throw erro(404, "Arrecadação não encontrada");
  return arrecadacao;
}

export async function listarArrecadacoes({ lojaId, limite = 30 } = {}) {
  return Arrecadacao.findAll({
    where: lojaId ? { lojaId } : {},
    include: [{ model: Loja, as: "loja", attributes: ["id", "nome"] }],
    attributes: { exclude: ["recebedorVisto"] },
    order: [["createdAt", "DESC"]],
    limit: Math.min(Number(limite) || 30, 100),
  });
}
