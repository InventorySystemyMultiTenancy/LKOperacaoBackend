export const calcularBloqueioAtivoReal = ({
  movimentacaoEmAndamento,
  quantidadeMovimentacoesReais,
  lojaConcluida,
}) => {
  return Boolean(
    movimentacaoEmAndamento &&
      Number(quantidadeMovimentacoesReais || 0) > 0 &&
      !lojaConcluida,
  );
};

export const precisaAutocorrecaoLock = ({
  movimentacaoEmAndamento,
  quantidadeMovimentacoesReais,
  lojaConcluida,
}) => {
  return Boolean(
    movimentacaoEmAndamento &&
      (Number(quantidadeMovimentacoesReais || 0) <= 0 || lojaConcluida),
  );
};

export const limparEstadoLockLoja = () => ({
  movimentacaoEmAndamento: false,
  usuarioEmMovimentacaoId: null,
  dataInicioMovimentacao: null,
});
