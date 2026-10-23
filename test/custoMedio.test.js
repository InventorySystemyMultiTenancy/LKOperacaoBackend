import test from "node:test";
import assert from "node:assert/strict";
import { custoMedioAtualizado } from "../src/utils/custoMedio.js";

test("primeira compra: custo é o preço pago", () => {
  assert.equal(custoMedioAtualizado({ estoqueAnterior: 0, custoAnterior: 0, quantidade: 50, custoUnitario: 4.2 }), 4.2);
});

test("média ponderada com o estoque que já existia", () => {
  // 100 un. a R$ 4,00 + 50 un. a R$ 5,50 = (400 + 275) / 150 = 4,50
  assert.equal(custoMedioAtualizado({ estoqueAnterior: 100, custoAnterior: 4, quantidade: 50, custoUnitario: 5.5 }), 4.5);
});

test("sem custo anterior cadastrado vale o preço pago", () => {
  assert.equal(custoMedioAtualizado({ estoqueAnterior: 30, custoAnterior: 0, quantidade: 10, custoUnitario: 6 }), 6);
});

test("quantidade zero mantém o custo", () => {
  assert.equal(custoMedioAtualizado({ estoqueAnterior: 30, custoAnterior: 3.33, quantidade: 0, custoUnitario: 9 }), 3.33);
});
