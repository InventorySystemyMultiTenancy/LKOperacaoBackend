// Resultado de cada loja no período (mesma conta em Financeiro, Relatórios e
// Gráficos):
//   receita        = dinheiro + fichas + digital das coletas
//   custo produtos = prêmios que saíram x custo do produto (custo médio das
//                    compras; sem custo cadastrado usa o preço do produto)
//   comissão       = % do ponto sobre a receita; sem % no ponto, usa a % de
//                    cada máquina sobre o lucro (receita - custo), como antes
//   lucro líquido  = receita - custo produtos - comissão
//
// Saída sem produto informado (coleta antiga) usa o último produto da máquina.

const r2 = (v) => Math.round((Number(v) || 0) * 100) / 100;

export function custoDoProduto(produto) {
  const custo = Number(produto?.custoUnitario) || 0;
  if (custo > 0) return { valor: custo, estimado: false };
  const preco = Number(produto?.preco) || 0;
  return { valor: preco, estimado: true };
}

// movimentacoes: [{ maquinaId, receita, sairam, produtos: [{ produtoId, quantidadeSaiu }] }] em ordem de data
// maquinas: Map(id -> { nome, codigo, lojaId, percentualComissao })
// lojas: Map(id -> { nome, percentualComissao })
// produtos: Map(id -> { nome, custoUnitario, preco })
// produtoInicial: Map(maquinaId -> produtoId) antes do período
export function calcularResultadoLojas({ movimentacoes, maquinas, lojas, produtos, produtoInicial = new Map() }) {
  const porMaquina = new Map();
  const produtoAtual = new Map(produtoInicial);

  for (const mov of movimentacoes) {
    const maquina = maquinas.get(mov.maquinaId);
    if (!maquina) continue;
    const m =
      porMaquina.get(mov.maquinaId) ||
      { maquinaId: mov.maquinaId, nome: maquina.nome || maquina.codigo, lojaId: maquina.lojaId, receita: 0, premios: 0, custoProdutos: 0, premiosSemCusto: 0, custoEstimado: false };

    m.receita += Number(mov.receita) || 0;

    const detalhados = (mov.produtos || []).filter((p) => Number(p.quantidadeSaiu) > 0);
    let saidas = detalhados.map((p) => ({ produtoId: p.produtoId, quantidade: Number(p.quantidadeSaiu) }));
    const totalDetalhado = saidas.reduce((s, p) => s + p.quantidade, 0);
    const sairam = Math.max(Number(mov.sairam) || 0, totalDetalhado);
    if (!saidas.length && sairam > 0) {
      saidas = [{ produtoId: produtoAtual.get(mov.maquinaId) || null, quantidade: sairam }];
    }

    for (const s of saidas) {
      m.premios += s.quantidade;
      const produto = s.produtoId ? produtos.get(s.produtoId) : null;
      const custo = custoDoProduto(produto);
      if (!produto || custo.valor <= 0) {
        m.premiosSemCusto += s.quantidade;
        continue;
      }
      if (custo.estimado) m.custoEstimado = true;
      m.custoProdutos += custo.valor * s.quantidade;
    }

    const ultimo = (mov.produtos || []).find((p) => p.produtoId);
    if (ultimo) produtoAtual.set(mov.maquinaId, ultimo.produtoId);
    porMaquina.set(mov.maquinaId, m);
  }

  const porLoja = new Map();
  for (const m of porMaquina.values()) {
    const loja = lojas.get(m.lojaId) || { nome: "Sem loja", percentualComissao: 0 };
    const pctLoja = Number(loja.percentualComissao) || 0;
    const pctMaquina = Number(maquinas.get(m.maquinaId)?.percentualComissao) || 0;
    m.comissao = pctLoja > 0 ? (m.receita * pctLoja) / 100 : (Math.max(0, m.receita - m.custoProdutos) * pctMaquina) / 100;
    m.lucroLiquido = m.receita - m.custoProdutos - m.comissao;

    const l =
      porLoja.get(m.lojaId) ||
      { lojaId: m.lojaId, nome: loja.nome, percentualComissao: pctLoja, receita: 0, premios: 0, custoProdutos: 0, comissao: 0, lucroLiquido: 0, premiosSemCusto: 0, custoEstimado: false, maquinas: [] };
    for (const campo of ["receita", "premios", "custoProdutos", "comissao", "lucroLiquido", "premiosSemCusto"]) {
      l[campo] += m[campo];
    }
    l.custoEstimado = l.custoEstimado || m.custoEstimado;
    l.maquinas.push(m);
    porLoja.set(m.lojaId, l);
  }

  const arredondar = (o) => {
    for (const c of ["receita", "custoProdutos", "comissao", "lucroLiquido"]) o[c] = r2(o[c]);
    o.margem = o.receita > 0 ? r2((o.lucroLiquido / o.receita) * 100) : 0;
    return o;
  };

  const lojasResultado = [...porLoja.values()]
    .map((l) => {
      l.maquinas = l.maquinas.map(arredondar).sort((a, b) => b.lucroLiquido - a.lucroLiquido);
      return arredondar(l);
    })
    .sort((a, b) => b.lucroLiquido - a.lucroLiquido);

  const totais = arredondar(
    lojasResultado.reduce(
      (t, l) => {
        for (const c of ["receita", "premios", "custoProdutos", "comissao", "lucroLiquido", "premiosSemCusto"]) t[c] += l[c];
        return t;
      },
      { receita: 0, premios: 0, custoProdutos: 0, comissao: 0, lucroLiquido: 0, premiosSemCusto: 0 },
    ),
  );

  return { lojas: lojasResultado, totais };
}
