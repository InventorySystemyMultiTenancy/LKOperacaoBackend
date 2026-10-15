import test from "node:test";
import assert from "node:assert/strict";
import { sanitizarPermissoes, temPermissao } from "../src/utils/permissoes.js";

test("ADMIN sempre tem permissão, mesmo com lista personalizada", () => {
  assert.equal(temPermissao({ role: "ADMIN", permissoes: [] }, "financeiro"), true);
  assert.equal(temPermissao({ role: "ADMIN", permissoes: null }, "relatorios"), true);
});

test("sem personalização usa as roles legadas", () => {
  const fin = { role: "FINANCEIRO", permissoes: null };
  assert.equal(temPermissao(fin, "financeiro", ["ADMIN", "FINANCEIRO"]), true);
  assert.equal(temPermissao(fin, "relatorios", ["ADMIN"]), false);
});

test("com personalização vale só a lista, ignorando a role", () => {
  const u = { role: "FUNCIONARIO", permissoes: ["manutencoes", "financeiro"] };
  assert.equal(temPermissao(u, "financeiro", ["ADMIN", "FINANCEIRO"]), true);
  // FUNCIONARIO tinha acesso por role, mas não recebeu a permissão
  assert.equal(temPermissao(u, "manutencoes.atualizar", ["ADMIN", "FUNCIONARIO"]), false);
  // qualquer uma das chaves basta
  assert.equal(temPermissao(u, ["relatorios", "financeiro"], ["ADMIN"]), true);
});

test("sanitizarPermissoes descarta chaves desconhecidas e duplicadas", () => {
  assert.equal(sanitizarPermissoes(null), null);
  assert.equal(sanitizarPermissoes(undefined), null);
  assert.equal(sanitizarPermissoes("financeiro"), null);
  assert.deepEqual(
    sanitizarPermissoes(["financeiro", "financeiro", "usuarios", "hack"]),
    ["financeiro"]
  );
  assert.deepEqual(sanitizarPermissoes([]), []);
});
