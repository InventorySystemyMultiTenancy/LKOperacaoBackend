// Custo médio ponderado do produto depois de uma compra:
// (estoque que já existia x custo atual + quantidade comprada x preço pago)
// dividido pelo estoque novo. Sem estoque ou sem custo anterior, vale o preço pago.
export function custoMedioAtualizado({ estoqueAnterior, custoAnterior, quantidade, custoUnitario }) {
  const qtdAnterior = Math.max(0, Number(estoqueAnterior) || 0);
  const custoAnt = Math.max(0, Number(custoAnterior) || 0);
  const qtd = Math.max(0, Number(quantidade) || 0);
  const preco = Math.max(0, Number(custoUnitario) || 0);

  if (!qtd) return Math.round(custoAnt * 100) / 100;
  if (!qtdAnterior || !custoAnt) return Math.round(preco * 100) / 100;
  const medio = (qtdAnterior * custoAnt + qtd * preco) / (qtdAnterior + qtd);
  return Math.round(medio * 100) / 100;
}
