import test from "node:test";
import assert from "node:assert/strict";
import { calcularConferencia } from "../src/utils/conferenciaMaquina.js";

// R$ 2,00 a jogada, 1 pelúcia a cada 15 jogadas, 1 pulso = R$ 1,00
const maquina = { valorPulso: 1, valorJogada: 2, jogadasPorPremio: 15 };
const anterior = { contadorIn: 1000, contadorOut: 50 };

const conferir = (atual, periodo = {}) =>
  calcularConferencia({ maquina, anterior, atual, periodo });

test("R$ 60 com 2 prêmios: dentro do configurado", () => {
  const r = conferir({ contadorIn: 1060, contadorOut: 52 }, { digital: 20 });
  assert.equal(r.status, "CONFERIDA");
  assert.equal(r.receitaContador, 60);
  assert.equal(r.jogadas, 30);
  assert.equal(r.premiosEsperados, 2);
  assert.equal(r.premiosSaida, 2);
  assert.equal(r.fisicoEsperado, 40);
  assert.equal(r.nivel, "OK");
});

test("1 prêmio a mais: alerta leve", () => {
  const r = conferir({ contadorIn: 1060, contadorOut: 53 }, { digital: 20 });
  assert.equal(r.nivel, "LEVE");
  assert.ok(r.alertas.some((a) => a.tipo === "PREMIOS_ACIMA" && a.nivel === "LEVE"));
});

test("muito mais prêmios que o configurado: urgente para reconfigurar", () => {
  const r = conferir({ contadorIn: 1060, contadorOut: 57 }, { digital: 20 });
  assert.equal(r.nivel, "URGENTE");
  assert.ok(r.alertas.some((a) => a.tipo === "PREMIOS_ACIMA" && /reconfigure/.test(a.mensagem)));
});

test("dinheiro físico esperado desconta o digital da Machine Pay", () => {
  const r = conferir({ contadorIn: 1200, contadorOut: 56 }, { digital: 150, fisicoContado: 50 });
  assert.equal(r.receitaContador, 200);
  assert.equal(r.fisicoEsperado, 50);
  assert.equal(r.diferencaDinheiro, 0);
  assert.equal(r.nivel, "OK");
});

test("falta de dinheiro físico gera alerta", () => {
  const leve = conferir({ contadorIn: 1200, contadorOut: 56 }, { digital: 100, fisicoContado: 90 });
  assert.equal(leve.nivel, "LEVE");
  const urgente = conferir({ contadorIn: 1200, contadorOut: 56 }, { digital: 100, fisicoContado: 50 });
  assert.equal(urgente.nivel, "URGENTE");
  assert.ok(urgente.alertas.some((a) => a.tipo === "DINHEIRO_FALTANDO"));
});

test("digital maior que o contador: contador não conta a Machine Pay", () => {
  const r = conferir({ contadorIn: 1030, contadorOut: 51 }, { digital: 80 });
  assert.equal(r.nivel, "URGENTE");
  assert.ok(r.alertas.some((a) => a.tipo === "DIGITAL_MAIOR_QUE_CONTADOR"));
});

test("contador menor que o anterior é inválido", () => {
  const r = conferir({ contadorIn: 900, contadorOut: 51 });
  assert.equal(r.status, "CONTADOR_INVALIDO");
  assert.equal(r.nivel, "URGENTE");
});

test("primeira leitura vira base", () => {
  const r = calcularConferencia({
    maquina,
    anterior: null,
    atual: { contadorIn: 10, contadorOut: 1 },
  });
  assert.equal(r.status, "PRIMEIRA_LEITURA");
  assert.equal(r.nivel, "OK");
});

test("sem valorJogada usa valorFicha x fichasNecessarias", () => {
  const r = calcularConferencia({
    maquina: { valorFicha: 1, fichasNecessarias: 2, jogadasPorPremio: 15 },
    anterior,
    atual: { contadorIn: 1060, contadorOut: 52 },
  });
  assert.equal(r.config.valorJogada, 2);
  assert.equal(r.premiosEsperados, 2);
});

test("OUT diferente da contagem de estoque", () => {
  const r = conferir({ contadorIn: 1060, contadorOut: 52 }, { digital: 20, premiosEstoque: 6 });
  assert.ok(r.alertas.some((a) => a.tipo === "OUT_DIFERENTE_ESTOQUE"));
});
