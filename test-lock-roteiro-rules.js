import assert from "node:assert/strict";
import {
  calcularBloqueioAtivoReal,
  limparEstadoLockLoja,
  precisaAutocorrecaoLock,
} from "./src/utils/roteiroLockRules.js";

const executarTeste = (nome, fn) => {
  try {
    fn();
    console.log(`PASS: ${nome}`);
  } catch (error) {
    console.error(`FAIL: ${nome}`);
    console.error(error);
    process.exitCode = 1;
  }
};

executarTeste("Cenario A: flag true sem movimentacao real nao bloqueia", () => {
  const bloqueio = calcularBloqueioAtivoReal({
    movimentacaoEmAndamento: true,
    quantidadeMovimentacoesReais: 0,
    lojaConcluida: false,
  });

  const autocorrecao = precisaAutocorrecaoLock({
    movimentacaoEmAndamento: true,
    quantidadeMovimentacoesReais: 0,
    lojaConcluida: false,
  });

  assert.equal(bloqueio, false);
  assert.equal(autocorrecao, true);
});

executarTeste("Cenario B: movimentacao real pendente bloqueia", () => {
  const bloqueio = calcularBloqueioAtivoReal({
    movimentacaoEmAndamento: true,
    quantidadeMovimentacoesReais: 2,
    lojaConcluida: false,
  });

  assert.equal(bloqueio, true);
});

executarTeste("Cenario C: concluir loja remove lock e libera outras", () => {
  const estadoLock = limparEstadoLockLoja();

  assert.deepEqual(estadoLock, {
    movimentacaoEmAndamento: false,
    usuarioEmMovimentacaoId: null,
    dataInicioMovimentacao: null,
  });

  const bloqueioPosConclusao = calcularBloqueioAtivoReal({
    movimentacaoEmAndamento: estadoLock.movimentacaoEmAndamento,
    quantidadeMovimentacoesReais: 0,
    lojaConcluida: true,
  });

  assert.equal(bloqueioPosConclusao, false);
});

executarTeste("Cenario D: concluir repetido e idempotente", () => {
  const primeiro = limparEstadoLockLoja();
  const segundo = limparEstadoLockLoja();

  assert.deepEqual(primeiro, segundo);
  assert.equal(primeiro.movimentacaoEmAndamento, false);
});

if (!process.exitCode) {
  console.log("Todos os cenarios de bloqueio passaram.");
}
