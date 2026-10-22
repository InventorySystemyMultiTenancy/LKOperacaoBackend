import test from "node:test";
import assert from "node:assert/strict";
import { resumirVendasPonto } from "../src/utils/relatorioVendasPonto.js";

const vendas = [
  { tipo: "PIX", valor: 10 },
  { tipo: "PIX", valor: 5.5 },
  { tipo: "Débito", valor: 20 },
  { tipo: "Crédito", valor: 30.1 },
  { tipo: "PIX", valor: 8, devolvido: true },
];

test("totais por método sem as devolvidas", () => {
  const r = resumirVendasPonto(vendas, 0);
  assert.equal(r.quantidadeVendas, 4);
  assert.equal(r.quantidadeDevolvidas, 1);
  assert.equal(r.totalVendas, 65.6);
  assert.deepEqual(r.porMetodo, [
    { metodo: "Crédito", quantidade: 1, total: 30.1 },
    { metodo: "Débito", quantidade: 1, total: 20 },
    { metodo: "PIX", quantidade: 2, total: 15.5 },
  ]);
});

test("comissão do ponto sobre o total e líquido", () => {
  const r = resumirVendasPonto(vendas, 25);
  assert.equal(r.totalComissao, 16.4);
  assert.equal(r.totalLiquido, 49.2);
});

test("percentual limitado e sem vendas", () => {
  assert.equal(resumirVendasPonto(vendas, 250).totalLiquido, 0);
  const vazio = resumirVendasPonto([], 30);
  assert.equal(vazio.totalVendas, 0);
  assert.equal(vazio.totalComissao, 0);
});

test("método sem emoji do painel", () => {
  const r = resumirVendasPonto([{ tipo: "✅ Pix", valor: 2 }, { tipo: "💳 Crédito", valor: 3 }], 0);
  assert.deepEqual(r.porMetodo.map((m) => m.metodo).sort(), ["Crédito", "Pix"]);
});
