// Contas do Controle de Arrecadação (mesmas do papel):
// - total de cada máquina = dinheiro + cartão + PIX + moeda + fichas
//   ("caiu" é quantidade de prêmios, não entra na soma em R$)
// - valor bruto = soma dos totais das máquinas
// - comissão = bruto x % do ponto; líquido = bruto - comissão

export const CAMPOS_VALOR = ["dinheiro", "cartao", "pix", "moeda", "fichas"];

const dinheiro = (valor) => {
  const n = Number(valor);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
};

const inteiroOuNulo = (valor) => {
  if (valor === null || valor === undefined || valor === "") return null;
  const n = Number(valor);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};

export function calcularArrecadacao(itens = [], percentualComissao = 0) {
  const normalizados = itens.map((item) => {
    const valores = Object.fromEntries(CAMPOS_VALOR.map((c) => [c, dinheiro(item[c])]));
    const total = CAMPOS_VALOR.reduce((soma, c) => soma + valores[c], 0);
    return {
      maquinaId: item.maquinaId,
      maquinaNome: item.maquinaNome || null,
      ...valores,
      caiu: inteiroOuNulo(item.caiu) ?? 0,
      contadorIn: inteiroOuNulo(item.contadorIn),
      contadorOut: inteiroOuNulo(item.contadorOut),
      total: Math.round(total * 100) / 100,
      movimentacaoId: item.movimentacaoId || null,
    };
  });

  const totais = Object.fromEntries(
    [...CAMPOS_VALOR, "caiu"].map((c) => [
      c,
      Math.round(normalizados.reduce((soma, item) => soma + item[c], 0) * 100) / 100,
    ]),
  );

  const percentual = Math.min(100, Math.max(0, Number(percentualComissao) || 0));
  const valorBruto = Math.round(normalizados.reduce((s, i) => s + i.total, 0) * 100) / 100;
  const valorComissao = Math.round(valorBruto * percentual) / 100;
  const valorLiquido = Math.round((valorBruto - valorComissao) * 100) / 100;

  return {
    itens: normalizados,
    totais,
    valorBruto,
    percentualComissao: percentual,
    valorComissao,
    valorLiquido,
  };
}
