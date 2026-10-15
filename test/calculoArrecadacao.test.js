import test from "node:test";
import assert from "node:assert/strict";
import { calcularArrecadacao } from "../src/utils/calculoArrecadacao.js";

test("soma das máquinas, comissão do ponto e líquido", () => {
  const r = calcularArrecadacao(
    [
      { maquinaId: "a", dinheiro: 120, cartao: 30, pix: 50, moeda: 7.5, fichas: 0, caiu: 4 },
      { maquinaId: "b", dinheiro: "40", cartao: "", pix: 10, moeda: null, fichas: 2.5, caiu: "1" },
    ],
    30,
  );
  assert.equal(r.itens[0].total, 207.5);
  assert.equal(r.itens[1].total, 52.5);
  assert.deepEqual(r.totais, { dinheiro: 160, cartao: 30, pix: 60, moeda: 7.5, fichas: 2.5, caiu: 5 });
  assert.equal(r.valorBruto, 260);
  assert.equal(r.valorComissao, 78);
  assert.equal(r.valorLiquido, 182);
});

test("caiu não entra no valor em R$ e valores inválidos viram zero", () => {
  const r = calcularArrecadacao([{ maquinaId: "a", dinheiro: -10, pix: "abc", caiu: 9 }], 0);
  assert.equal(r.itens[0].total, 0);
  assert.equal(r.valorBruto, 0);
  assert.equal(r.totais.caiu, 9);
});

test("percentual fora da faixa é limitado e arredonda centavos", () => {
  assert.equal(calcularArrecadacao([{ maquinaId: "a", dinheiro: 100 }], 150).valorComissao, 100);
  const r = calcularArrecadacao([{ maquinaId: "a", dinheiro: 33.33 }], 33.33);
  assert.equal(r.valorComissao, 11.11);
  assert.equal(r.valorLiquido, 22.22);
});
