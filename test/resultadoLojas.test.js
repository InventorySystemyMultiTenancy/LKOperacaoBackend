import test from "node:test";
import assert from "node:assert/strict";
import { calcularResultadoLojas } from "../src/utils/resultadoLojas.js";

const maquinas = new Map([
  ["m1", { nome: "Grua 1", lojaId: "l1", percentualComissao: 0 }],
  ["m2", { nome: "Grua 2", lojaId: "l1", percentualComissao: 0 }],
  ["m3", { nome: "Grua 3", lojaId: "l2", percentualComissao: 50 }],
]);
const lojas = new Map([
  ["l1", { nome: "Shopping", percentualComissao: 30 }],
  ["l2", { nome: "Mercado", percentualComissao: 0 }],
]);
const produtos = new Map([
  ["urso", { nome: "Urso", custoUnitario: 4.5, preco: 10 }],
  ["coelho", { nome: "Coelho", custoUnitario: 0, preco: 8 }],
]);

test("custo das pelúcias por loja e lucro líquido", () => {
  const r = calcularResultadoLojas({
    movimentacoes: [
      { maquinaId: "m1", receita: 200, sairam: 10, produtos: [{ produtoId: "urso", quantidadeSaiu: 10 }] },
      { maquinaId: "m2", receita: 100, sairam: 4, produtos: [] }, // sem produto: usa o da máquina
      { maquinaId: "m3", receita: 100, sairam: 5, produtos: [{ produtoId: "coelho", quantidadeSaiu: 5 }] },
    ],
    maquinas,
    lojas,
    produtos,
    produtoInicial: new Map([["m2", "urso"]]),
  });
  const shopping = r.lojas.find((l) => l.nome === "Shopping");
  // custo: 10 x 4,50 + 4 x 4,50 = 63; comissão 30% de 300 = 90; lucro 300 - 63 - 90 = 147
  assert.equal(shopping.custoProdutos, 63);
  assert.equal(shopping.comissao, 90);
  assert.equal(shopping.lucroLiquido, 147);
  assert.equal(shopping.premios, 14);

  const mercado = r.lojas.find((l) => l.nome === "Mercado");
  // sem custo cadastrado: usa o preço (8) e marca estimado; comissão 50% do lucro (100 - 40)
  assert.equal(mercado.custoProdutos, 40);
  assert.equal(mercado.custoEstimado, true);
  assert.equal(mercado.comissao, 30);
  assert.equal(mercado.lucroLiquido, 30);

  assert.equal(r.totais.receita, 400);
  assert.equal(r.totais.lucroLiquido, 177);
});

test("saída sem produto conhecido conta como prêmio sem custo", () => {
  const r = calcularResultadoLojas({
    movimentacoes: [{ maquinaId: "m1", receita: 50, sairam: 3, produtos: [] }],
    maquinas,
    lojas,
    produtos,
  });
  assert.equal(r.lojas[0].premiosSemCusto, 3);
  assert.equal(r.lojas[0].custoProdutos, 0);
});
