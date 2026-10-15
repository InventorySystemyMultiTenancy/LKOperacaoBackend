import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizarNomeConta,
  ehDaContaConfigurada,
} from "../src/services/machinePayMonitorService.js";

test("nome da conta ignora acentos, caixa e espaços", () => {
  assert.equal(
    normalizarNomeConta("Gleison Lucasda Silva"),
    normalizarNomeConta("GLEISON LUCAS DA SILVA"),
  );
  assert.equal(normalizarNomeConta("Ação  Ltda."), "acaoltda");
});

test("filtra leitores pela conta configurada", () => {
  process.env.MACHINE_PAY_CONTA_NOME = "Gleison Lucasda Silva";
  assert.equal(ehDaContaConfigurada("Gleison Lucas da Silva"), true);
  assert.equal(ehDaContaConfigurada("Gleison Lucasda Silva(GLEISON)"), true);
  assert.equal(ehDaContaConfigurada("Clube Kids(LIVIA)"), false);
  delete process.env.MACHINE_PAY_CONTA_NOME;
  assert.equal(ehDaContaConfigurada("Qualquer"), true);
});
