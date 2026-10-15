import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizarHorarioFuncionamento,
  pontoAberto,
} from "../src/utils/horarioFuncionamento.js";

// Datas em UTC; Brasília = UTC-3. 2026-10-14 é quarta-feira (dia 3).
const brasilia = (dataHora) => new Date(`${dataHora}-03:00`);

test("sem horário cadastrado o ponto é considerado sempre aberto", () => {
  assert.equal(pontoAberto(null, brasilia("2026-10-14T03:00:00")), true);
});

test("respeita o horário do dia", () => {
  const horario = { 3: { inicio: "10:00", fim: "22:00" } };
  assert.equal(pontoAberto(horario, brasilia("2026-10-14T09:59:00")), false);
  assert.equal(pontoAberto(horario, brasilia("2026-10-14T10:00:00")), true);
  assert.equal(pontoAberto(horario, brasilia("2026-10-14T21:59:00")), true);
  assert.equal(pontoAberto(horario, brasilia("2026-10-14T22:00:00")), false);
});

test("dia não marcado fica fechado o dia todo", () => {
  const horario = { 3: { inicio: "10:00", fim: "22:00" } };
  assert.equal(pontoAberto(horario, brasilia("2026-10-15T12:00:00")), false);
});

test("expediente que passa da meia-noite", () => {
  const horario = { 3: { inicio: "18:00", fim: "02:00" } };
  assert.equal(pontoAberto(horario, brasilia("2026-10-14T23:00:00")), true);
  assert.equal(pontoAberto(horario, brasilia("2026-10-15T01:30:00")), true);
  assert.equal(pontoAberto(horario, brasilia("2026-10-15T02:30:00")), false);
  assert.equal(pontoAberto(horario, brasilia("2026-10-14T01:30:00")), false);
});

test("validação do formulário", () => {
  assert.deepEqual(normalizarHorarioFuncionamento(null), { valor: null });
  assert.ok(normalizarHorarioFuncionamento({ 1: { inicio: "25:00", fim: "10:00" } }).erro);
  assert.ok(normalizarHorarioFuncionamento({ 9: { inicio: "10:00", fim: "12:00" } }).erro);
  assert.ok(normalizarHorarioFuncionamento({}).erro);
  assert.deepEqual(normalizarHorarioFuncionamento({ 1: { inicio: "10:00", fim: "22:00" } }), {
    valor: { 1: { inicio: "10:00", fim: "22:00" } },
  });
});
