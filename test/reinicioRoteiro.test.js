import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizarReinicio,
  deveReiniciar,
  proximoReinicio,
  ultimoReinicioAgendado,
  descreverReinicio,
  vezesPorSemana,
  categoriaDoRoteiro,
} from "../src/utils/reinicioRoteiro.js";

// 15/10/2026 é quinta-feira. Horários em Brasília (-03:00).
const br = (texto) => new Date(`${texto}-03:00`);

test("diário: reinicia uma vez por dia no horário escolhido", () => {
  const r = normalizarReinicio({ modo: "diario", hora: "06:00" });
  assert.equal(deveReiniciar(r, br("2026-10-14T07:00:00"), br("2026-10-15T05:59:00")), false);
  assert.equal(deveReiniciar(r, br("2026-10-14T07:00:00"), br("2026-10-15T06:01:00")), true);
  // já reiniciou hoje às 06:00: não repete
  assert.equal(deveReiniciar(r, br("2026-10-15T06:01:00"), br("2026-10-15T23:00:00")), false);
});

test("dias da semana: segunda e quinta (2x por semana)", () => {
  const r = normalizarReinicio({ modo: "dias_semana", diasSemana: [4, 1, 1], hora: "00:00" });
  assert.deepEqual(r.diasSemana, [1, 4]);
  assert.equal(vezesPorSemana(r), 2);
  assert.equal(descreverReinicio(r), "Reinicia Seg, Qui às 00:00 (2x por semana)");
  // quinta 15/10: reinício de 00:00 de hoje
  assert.equal(ultimoReinicioAgendado(r, br("2026-10-15T10:00:00")).toISOString(), br("2026-10-15T00:00:00").toISOString());
  assert.equal(deveReiniciar(r, br("2026-10-13T10:00:00"), br("2026-10-15T10:00:00")), true);
  // sexta: o último continua sendo quinta
  assert.equal(deveReiniciar(r, br("2026-10-15T00:05:00"), br("2026-10-16T10:00:00")), false);
  // próximo: segunda 19/10
  assert.equal(proximoReinicio(r, br("2026-10-16T10:00:00")).toISOString(), br("2026-10-19T00:00:00").toISOString());
});

test("intervalo: a cada 3 dias a partir da data escolhida", () => {
  const r = normalizarReinicio({ modo: "intervalo", intervaloDias: 3, inicio: "2026-10-10", hora: "08:00" });
  // agendados: 10, 13, 16...
  assert.equal(ultimoReinicioAgendado(r, br("2026-10-15T12:00:00")).toISOString(), br("2026-10-13T08:00:00").toISOString());
  assert.equal(proximoReinicio(r, br("2026-10-15T12:00:00")).toISOString(), br("2026-10-16T08:00:00").toISOString());
  assert.equal(deveReiniciar(r, br("2026-10-13T09:00:00"), br("2026-10-15T12:00:00")), false);
  assert.equal(deveReiniciar(r, br("2026-10-13T09:00:00"), br("2026-10-16T08:30:00")), true);
});

test("nunca: não reinicia sozinho", () => {
  const r = normalizarReinicio({ modo: "nunca" });
  assert.equal(deveReiniciar(r, null, new Date()), false);
  assert.equal(proximoReinicio(r), null);
});

test("roteiro criado depois do horário não reinicia na hora", () => {
  const r = normalizarReinicio({ modo: "diario", hora: "00:00" });
  assert.equal(deveReiniciar(r, br("2026-10-15T09:00:00"), br("2026-10-15T09:01:00")), false);
});

test("validação", () => {
  assert.throws(() => normalizarReinicio({ modo: "dias_semana", diasSemana: [] }), /pelo menos um dia/);
  assert.throws(() => normalizarReinicio({ modo: "intervalo", intervaloDias: 0 }), /1 a 60/);
  assert.throws(() => normalizarReinicio({ modo: "xpto" }), /reinicia/);
  assert.equal(normalizarReinicio({ modo: "diario", hora: "25:00" }).hora, "00:00");
  assert.equal(normalizarReinicio(null), null);
});

test("categoria de roteiros antigos pelo nome", () => {
  assert.equal(categoriaDoRoteiro({ zona: "Segunda 1" }), "Dias da Semana");
  assert.equal(categoriaDoRoteiro({ zona: "Bolinha 3" }), "Bolinhas");
  assert.equal(categoriaDoRoteiro({ zona: "Gruas Gigantes" }), "Gigantes");
  assert.equal(categoriaDoRoteiro({ zona: "Shoppings", categoria: "Shoppings Zona Sul" }), "Shoppings Zona Sul");
});
