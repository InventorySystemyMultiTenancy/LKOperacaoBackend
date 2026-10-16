import { Op, fn, col, literal } from "sequelize";
import {
  Movimentacao,
  MovimentacaoProduto,
  Produto,
  Maquina,
  Loja,
  Manutencao,
  RoteiroGasto,
  MachinePayDiario,
} from "../models/index.js";

// Mês em Brasília: { inicio, fim } (Date) e { diaInicio, diaFim } (AAAA-MM-DD)
export function periodoDoMes(mes) {
  const agoraBR = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const [ano, m] = /^\d{4}-\d{2}$/.test(mes || "")
    ? mes.split("-").map(Number)
    : [agoraBR.getUTCFullYear(), agoraBR.getUTCMonth() + 1];
  const diaInicio = `${ano}-${String(m).padStart(2, "0")}-01`;
  const proximo = m === 12 ? `${ano + 1}-01-01` : `${ano}-${String(m + 1).padStart(2, "0")}-01`;
  const ultimoDia = new Date(Date.parse(`${proximo}T12:00:00Z`) - 86400000).toISOString().slice(0, 10);
  return {
    mes: diaInicio.slice(0, 7),
    inicio: new Date(`${diaInicio}T00:00:00-03:00`),
    fim: new Date(`${proximo}T00:00:00-03:00`),
    diaInicio,
    diaFim: ultimoDia,
  };
}

const soma = (valor) => Math.round((Number(valor) || 0) * 100) / 100;

async function valoresDoMes(p) {
  const noMes = { dataColeta: { [Op.gte]: p.inicio, [Op.lt]: p.fim } };

  const [mov] = await Movimentacao.findAll({
    where: { ...noMes, retiradaEstoque: { [Op.not]: true } },
    attributes: [
      [fn("COALESCE", fn("SUM", col("valor_entrada_notas")), 0), "notas"],
      [fn("COALESCE", fn("SUM", col("valor_entrada_fichas")), 0), "fichas"],
      [fn("COALESCE", fn("SUM", col("valor_entrada_cartao")), 0), "cartao"],
    ],
    raw: true,
  });

  // Machine Pay: vendas que os leitores registraram no mês (monitoramento).
  // Sem monitoramento, usa o digital lançado nas coletas.
  const [diario] = await MachinePayDiario.findAll({
    where: { data: { [Op.between]: [p.diaInicio, p.diaFim] } },
    attributes: [
      [fn("COALESCE", fn("SUM", col("vendas_valor")), 0), "valor"],
      [fn("COUNT", col("id")), "registros"],
    ],
    raw: true,
  });
  const temMonitor = Number(diario?.registros) > 0;
  const machinePay = temMonitor ? soma(diario.valor) : soma(mov?.cartao);

  const dinheiroFisico = soma(Number(mov?.notas) + Number(mov?.fichas));

  const [gasto] = await RoteiroGasto.findAll({
    where: { createdAt: { [Op.gte]: p.inicio, [Op.lt]: p.fim } },
    attributes: [[fn("COALESCE", fn("SUM", col("valor")), 0), "total"]],
    raw: true,
  });

  return {
    vendasMes: soma(machinePay + dinheiroFisico),
    machinePay,
    machinePayFonte: temMonitor ? "monitor" : "coletas",
    dinheiroFisico,
    gastoVariavel: soma(gasto?.total),
  };
}

async function topMaquinas(p, limite = 5) {
  const linhas = await Movimentacao.findAll({
    where: {
      dataColeta: { [Op.gte]: p.inicio, [Op.lt]: p.fim },
      retiradaEstoque: { [Op.not]: true },
    },
    attributes: [
      "maquinaId",
      [
        literal(
          'COALESCE(SUM(COALESCE("valor_entrada_notas",0) + COALESCE("valor_entrada_fichas",0) + COALESCE("valor_entrada_cartao",0)),0)',
        ),
        "total",
      ],
    ],
    group: ["maquinaId"],
    order: [[literal('"total"'), "DESC"]],
    limit: limite,
    raw: true,
  });
  if (!linhas.length) return [];
  const maquinas = await Maquina.findAll({
    where: { id: linhas.map((l) => l.maquinaId) },
    attributes: ["id", "codigo", "nome"],
    include: [{ model: Loja, as: "loja", attributes: ["nome"] }],
  });
  const porId = new Map(maquinas.map((m) => [m.id, m]));
  return linhas
    .filter((l) => Number(l.total) > 0)
    .map((l) => {
      const m = porId.get(l.maquinaId);
      return {
        maquinaId: l.maquinaId,
        nome: m?.nome || m?.codigo || "Máquina",
        loja: m?.loja?.nome || null,
        total: soma(l.total),
      };
    });
}

async function topProdutos(p, limite = 5) {
  const linhas = await MovimentacaoProduto.findAll({
    attributes: ["produtoId", [fn("SUM", col("MovimentacaoProduto.quantidadeSaiu")), "quantidade"]],
    include: [
      {
        model: Movimentacao,
        attributes: [],
        where: { dataColeta: { [Op.gte]: p.inicio, [Op.lt]: p.fim } },
      },
    ],
    group: ["produtoId"],
    order: [[literal('"quantidade"'), "DESC"]],
    limit: limite,
    raw: true,
  });
  if (!linhas.length) return [];
  const produtos = await Produto.findAll({
    where: { id: linhas.map((l) => l.produtoId) },
    attributes: ["id", "nome", "emoji"],
  });
  const porId = new Map(produtos.map((pr) => [pr.id, pr]));
  return linhas
    .filter((l) => Number(l.quantidade) > 0)
    .map((l) => ({
      produtoId: l.produtoId,
      nome: porId.get(l.produtoId)?.nome || "Produto",
      emoji: porId.get(l.produtoId)?.emoji || "🧸",
      quantidade: Number(l.quantidade),
    }));
}

export async function resumoDashboard({ usuario, mes, verValores }) {
  const p = periodoDoMes(mes);

  const ondeManutencao = { status: { [Op.ne]: "concluido" } };
  if (usuario.role === "FUNCIONARIO") ondeManutencao.funcionarioId = usuario.id;
  const [pendentes, emAndamento] = await Promise.all([
    Manutencao.count({ where: { ...ondeManutencao, status: "pendente" } }),
    Manutencao.count({ where: { ...ondeManutencao, status: "em_andamento" } }),
  ]);

  return {
    mes: p.mes,
    valores: verValores ? await valoresDoMes(p) : null,
    manutencoes: { pendentes, emAndamento, abertas: pendentes + emAndamento },
    top: verValores
      ? { maquinas: await topMaquinas(p), produtos: await topProdutos(p) }
      : null,
  };
}
