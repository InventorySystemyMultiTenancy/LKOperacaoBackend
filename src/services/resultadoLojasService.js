import { Op } from "sequelize";
import { Movimentacao, MovimentacaoProduto, Maquina, Loja, Produto } from "../models/index.js";
import { calcularResultadoLojas } from "../utils/resultadoLojas.js";

const REGEX_DATA = /^\d{4}-\d{2}-\d{2}$/;

// Período em dias inteiros de Brasília. Padrão: mês atual.
export function periodoResultado({ dataInicio, dataFim } = {}) {
  const hoje = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
  const inicio = REGEX_DATA.test(dataInicio || "") ? dataInicio : `${hoje.slice(0, 7)}-01`;
  const fim = REGEX_DATA.test(dataFim || "") ? dataFim : hoje;
  const [a, b] = inicio <= fim ? [inicio, fim] : [fim, inicio];
  const depois = new Date(Date.parse(`${b}T12:00:00Z`) + 86400e3).toISOString().slice(0, 10);
  return {
    dataInicio: a,
    dataFim: b,
    de: new Date(`${a}T00:00:00-03:00`),
    ate: new Date(`${depois}T00:00:00-03:00`),
  };
}

async function produtoAntesDoPeriodo(maquinaId, antes) {
  const ultimo = await MovimentacaoProduto.findOne({
    include: [
      { model: Movimentacao, attributes: [], where: { maquinaId, dataColeta: { [Op.lt]: antes } }, required: true },
    ],
    order: [[Movimentacao, "dataColeta", "DESC"]],
    attributes: ["produtoId"],
  });
  return ultimo?.produtoId || null;
}

export async function resultadoPorLoja(query = {}) {
  const p = periodoResultado(query);

  const movs = await Movimentacao.findAll({
    where: {
      dataColeta: { [Op.gte]: p.de, [Op.lt]: p.ate },
      retiradaEstoque: { [Op.not]: true },
      ...(query.lojaId ? { lojaId: query.lojaId } : {}),
    },
    attributes: ["id", "maquinaId", "dataColeta", "sairam", "valorEntradaNotas", "valorEntradaFichas", "valorEntradaCartao"],
    include: [
      {
        model: MovimentacaoProduto,
        as: "detalhesProdutos",
        attributes: ["produtoId", "quantidadeSaiu"],
        required: false,
      },
    ],
    order: [["dataColeta", "ASC"]],
  });

  const [maquinas, lojas, produtos] = await Promise.all([
    Maquina.findAll({ attributes: ["id", "nome", "codigo", "lojaId", "percentualComissao"], raw: true }),
    Loja.findAll({ attributes: ["id", "nome", "percentualComissao"], raw: true }),
    Produto.findAll({ attributes: ["id", "nome", "custoUnitario", "preco"], raw: true }),
  ]);

  const produtoInicial = new Map();
  const comSaidaSemProduto = new Set(
    movs.filter((m) => Number(m.sairam) > 0 && !m.detalhesProdutos?.some((d) => d.produtoId)).map((m) => m.maquinaId),
  );
  for (const maquinaId of comSaidaSemProduto) {
    produtoInicial.set(maquinaId, await produtoAntesDoPeriodo(maquinaId, p.de));
  }

  const resultado = calcularResultadoLojas({
    movimentacoes: movs.map((m) => ({
      maquinaId: m.maquinaId,
      receita:
        (Number(m.valorEntradaNotas) || 0) + (Number(m.valorEntradaFichas) || 0) + (Number(m.valorEntradaCartao) || 0),
      sairam: Number(m.sairam) || 0,
      produtos: (m.detalhesProdutos || []).map((d) => ({ produtoId: d.produtoId, quantidadeSaiu: d.quantidadeSaiu })),
    })),
    maquinas: new Map(maquinas.map((m) => [m.id, m])),
    lojas: new Map(lojas.map((l) => [l.id, l])),
    produtos: new Map(produtos.map((pr) => [pr.id, pr])),
    produtoInicial,
  });

  return { periodo: { dataInicio: p.dataInicio, dataFim: p.dataFim }, ...resultado };
}
