// Resumo das vendas de um leitor no período para o relatório do ponto:
// vendas devolvidas ficam de fora; comissão = total x % do ponto.

const centavos = (valor) => Math.round((Number(valor) || 0) * 100);
const reais = (c) => c / 100;

// O painel manda o método com emoji ("✅ Pix", "💳 Crédito"): fica só o texto
export const limparMetodo = (tipo) =>
  String(tipo || "")
    .replace(/[^\p{L}\p{N} ./-]/gu, "")
    .replace(/\s+/g, " ")
    .trim() || "Outros";

export function resumirVendasPonto(vendas = [], percentualComissao = 0) {
  const validas = vendas.filter((v) => !v.devolvido && Number(v.valor) > 0);
  const grupos = new Map();
  for (const venda of validas) {
    const metodo = limparMetodo(venda.tipo);
    const atual = grupos.get(metodo) || { metodo, quantidade: 0, centavos: 0 };
    atual.quantidade += 1;
    atual.centavos += centavos(venda.valor);
    grupos.set(metodo, atual);
  }

  const totalCentavos = validas.reduce((s, v) => s + centavos(v.valor), 0);
  const percentual = Math.min(100, Math.max(0, Number(percentualComissao) || 0));
  const comissaoCentavos = Math.round((totalCentavos * percentual) / 100);

  return {
    quantidadeVendas: validas.length,
    quantidadeDevolvidas: vendas.filter((v) => v.devolvido).length,
    porMetodo: [...grupos.values()]
      .sort((a, b) => b.centavos - a.centavos)
      .map(({ metodo, quantidade, centavos: c }) => ({ metodo, quantidade, total: reais(c) })),
    totalVendas: reais(totalCentavos),
    percentualComissao: percentual,
    totalComissao: reais(comissaoCentavos),
    totalLiquido: reais(totalCentavos - comissaoCentavos),
  };
}
