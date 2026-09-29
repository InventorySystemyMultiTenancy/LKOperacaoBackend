import { Op } from "sequelize";
import { Movimentacao, Maquina, Usuario, Loja } from "../models/index.js";
import { buscarIdsResolvidos } from "./alertasResolvidos.js";

export const CATEGORIA_ALERTA_FINANCEIRO = "financeiro";

// Tolerância de arredondamento (R$) antes de considerar divergência um alerta
const TOLERANCIA_VALOR = 0.01;

// Acima disso, o valor esperado de uma única bag quase certamente veio de um
// contador IN com erro de leitura/digitação (ex: dígito a mais), não de uma
// divergência de dinheiro real. Nesses casos alertamos para conferir o
// contador em vez de acusar "dinheiro faltando/extra" com um valor absurdo.
const LIMITE_PLAUSIVEL_VALOR = 5000;

// Função utilitária para gerar alertas de divergência financeira em movimentações
// com retirada de dinheiro (bag). Compara o valor preenchido no financeiro
// (notas na bag + digital na Machine Pay) com o valor esperado, calculado a
// partir da diferença do contador IN.
//
// O contador IN mede coisas diferentes dependendo de como a máquina cobra:
// - Máquina SEM sistema de fichas (a maioria): o contador soma 1 para cada
//   R$1 que entra na máquina — a diferença do contador já É o valor em reais,
//   direto, sem multiplicar por nada.
// - Máquina COM sistema de fichas (fichasNecessarias configurado): o contador
//   soma 1 para cada ficha inserida, e cada jogada consome `fichasNecessarias`
//   fichas a `valorFicha` reais, então:
//     jogadas = diferençaContadorIn / fichasNecessarias
//     valorEsperado = jogadas * valorFicha
export async function gerarAlertasFinanceiros() {
  const idsResolvidos = await buscarIdsResolvidos(CATEGORIA_ALERTA_FINANCEIRO);

  const movimentacoes = await Movimentacao.findAll({
    where: {
      numeroBag: { [Op.ne]: null },
      statusFinanceiro: "concluido",
      contadorIn: { [Op.ne]: null },
    },
    include: [
      {
        model: Maquina,
        as: "maquina",
        attributes: [
          "id",
          "codigo",
          "nome",
          "valorFicha",
          "fichasNecessarias",
          "lojaId",
        ],
        include: [{ model: Loja, as: "loja", attributes: ["id", "nome"] }],
      },
      { model: Usuario, as: "usuario", attributes: ["id", "nome"] },
    ],
    order: [["dataColeta", "ASC"]],
  });

  // Máquinas de bolinha e kid rider não têm contador IN/OUT — só as gruas de
  // pelúcia têm. Em vez de depender do tipo cadastrado, detectamos pelos
  // dados: se uma máquina nunca teve contadorIn preenchido de verdade (sempre
  // 0), ela não tem contador físico e não deve gerar alerta financeiro —
  // senão toda coleta dela vira um falso "dinheiro extra" (esperado 0 contra
  // o valor real recolhido).
  const maquinaIds = [...new Set(movimentacoes.map((m) => m.maquinaId))];
  const movimentacoesComContadorReal = maquinaIds.length
    ? await Movimentacao.findAll({
        attributes: ["maquinaId"],
        where: {
          maquinaId: { [Op.in]: maquinaIds },
          contadorIn: { [Op.gt]: 0 },
        },
        group: ["maquinaId"],
      })
    : [];
  const idsMaquinasComContador = new Set(
    movimentacoesComContadorReal.map((m) => m.maquinaId),
  );

  const alertas = [];

  for (const mov of movimentacoes) {
    const maquina = mov.maquina;
    if (!maquina) continue;

    if (!idsMaquinasComContador.has(mov.maquinaId)) continue;

    const alertaId = `${CATEGORIA_ALERTA_FINANCEIRO}:${mov.id}`;
    if (idsResolvidos.has(alertaId)) continue;

    // A referência não é "a movimentação anterior, seja qual for" — entre duas
    // coletas com retirada de dinheiro pode haver visitas de reposição sem bag,
    // que não fecham o caixa da máquina. O ponto de partida do contador IN tem
    // que ser a última movimentação dessa máquina que também teve retirada de
    // dinheiro (numeroBag preenchido), senão a diferença mistura períodos que
    // já foram conferidos com o período atual.
    //
    // dataColeta costuma vir sem horário (só a data), então duas coletas da
    // mesma máquina no mesmo dia empatam nesse campo. Sem o desempate por
    // createdAt, "dataColeta < atual" pula a coleta realmente anterior e
    // busca uma bem mais antiga.
    const anterior = await Movimentacao.findOne({
      where: {
        maquinaId: mov.maquinaId,
        numeroBag: { [Op.ne]: null },
        [Op.or]: [
          { dataColeta: { [Op.lt]: mov.dataColeta } },
          {
            dataColeta: mov.dataColeta,
            createdAt: { [Op.lt]: mov.createdAt },
          },
        ],
      },
      order: [
        ["dataColeta", "DESC"],
        ["createdAt", "DESC"],
      ],
      attributes: [
        "id",
        "contadorIn",
        "contadorOut",
        "dataColeta",
        "numeroBag",
        "valorEntradaNotas",
        "valorEntradaCartao",
      ],
    });

    if (
      !anterior ||
      anterior.contadorIn === null ||
      anterior.contadorIn === undefined
    ) {
      // Sem movimentação anterior com contador registrado: não há como calcular a diferença
      continue;
    }

    if (Number(anterior.contadorIn) === 0 && Number(mov.contadorIn) === 0) {
      // Anterior e atual zerados: essa máquina não tem contador físico
      // preenchido neste período (ex: bolinha, kid rider). Sem leitura real,
      // não dá pra afirmar que o esperado é R$0 — não gera alerta.
      continue;
    }

    const diferencaContador = mov.contadorIn - anterior.contadorIn;
    if (diferencaContador < 0) {
      // Contador zerado/trocado de máquina: não avaliar como divergência financeira
      continue;
    }

    // fichasNecessarias só é configurado em máquinas que realmente usam
    // sistema de fichas. Sem ele, a máquina cobra em dinheiro direto e o
    // contador IN já soma reais, 1 a 1 — não fichas nem jogadas.
    const usaFichas =
      maquina.fichasNecessarias !== null &&
      maquina.fichasNecessarias !== undefined &&
      parseInt(maquina.fichasNecessarias) > 0;

    const valorFicha = usaFichas ? parseFloat(maquina.valorFicha) || 0 : null;
    const fichasNecessarias = usaFichas
      ? parseInt(maquina.fichasNecessarias)
      : null;
    const jogadas = usaFichas ? diferencaContador / fichasNecessarias : null;
    const valorEsperado = usaFichas
      ? jogadas * valorFicha
      : diferencaContador;

    const valorPreenchido =
      (parseFloat(mov.valorEntradaNotas) || 0) +
      (parseFloat(mov.valorEntradaCartao) || 0);

    const base = {
      alertaId,
      categoria: CATEGORIA_ALERTA_FINANCEIRO,
      movimentacaoId: mov.id,
      numeroBag: mov.numeroBag,
      maquina: {
        id: maquina.id,
        codigo: maquina.codigo,
        nome: maquina.nome,
        loja: maquina.loja?.nome || null,
      },
      usuario: mov.usuario?.nome || null,
      dataColeta: mov.dataColeta,
      diferencaContador,
      usaFichas,
      fichasNecessarias,
      jogadas,
      valorFicha,
      valorEsperado,
      valorPreenchido,
      // Detalhe das duas movimentações usadas no cálculo, para conferência manual
      movimentacaoAtual: {
        id: mov.id,
        numeroBag: mov.numeroBag,
        dataColeta: mov.dataColeta,
        contadorIn: mov.contadorIn,
        contadorOut: mov.contadorOut,
        valorEntradaNotas: parseFloat(mov.valorEntradaNotas) || 0,
        valorEntradaCartao: parseFloat(mov.valorEntradaCartao) || 0,
      },
      movimentacaoAnterior: {
        id: anterior.id,
        numeroBag: anterior.numeroBag,
        dataColeta: anterior.dataColeta,
        contadorIn: anterior.contadorIn,
        contadorOut: anterior.contadorOut,
        valorEntradaNotas: parseFloat(anterior.valorEntradaNotas) || 0,
        valorEntradaCartao: parseFloat(anterior.valorEntradaCartao) || 0,
      },
    };

    if (valorEsperado > LIMITE_PLAUSIVEL_VALOR) {
      alertas.push({
        ...base,
        tipo: "contador_suspeito",
        nivel: "info",
        diferenca: null,
        mensagem: `Contador IN da bag ${mov.numeroBag} de ${maquina.codigo} - ${maquina.nome} gerou um valor esperado implausível (R$ ${valorEsperado.toFixed(2)}). Provavelmente há um erro de leitura/digitação no contador — confira manualmente.`,
      });
      continue;
    }

    const diferenca = valorPreenchido - valorEsperado;

    if (Math.abs(diferenca) <= TOLERANCIA_VALOR) continue;

    const tipo = diferenca < 0 ? "dinheiro_faltando" : "dinheiro_extra";

    alertas.push({
      ...base,
      tipo,
      nivel: diferenca < 0 ? "danger" : "warning",
      diferenca,
      mensagem:
        diferenca < 0
          ? `Faltam R$ ${Math.abs(diferenca).toFixed(2)} na bag ${mov.numeroBag} de ${maquina.codigo} - ${maquina.nome}`
          : `Há R$ ${diferenca.toFixed(2)} a mais preenchido na bag ${mov.numeroBag} de ${maquina.codigo} - ${maquina.nome}`,
    });
  }

  // Mais recente primeiro
  return alertas.sort(
    (a, b) => new Date(b.dataColeta) - new Date(a.dataColeta),
  );
}
