// Conferência de uma leitura de relógio (contadores IN/OUT) contra a configuração
// da máquina e o que entrou pela Machine Pay.
//
// - Cada pulso do contador IN vale `valorPulso` (padrão R$ 1,00), e o contador
//   conta TODO o dinheiro: notas/moedas e também os créditos da Machine Pay.
// - Dinheiro físico esperado = receita do contador - valor digital (Machine Pay).
// - Jogadas = receita do contador / valor da jogada.
// - Prêmios esperados = jogadas / jogadas por prêmio (configuração da máquina).
// - Prêmios que saíram = diferença do contador OUT.

export const NIVEIS = ["OK", "LEVE", "URGENTE"];

const PESO_NIVEL = { OK: 0, LEVE: 1, URGENTE: 2 };

const numero = (valor) => {
  if (valor === null || valor === undefined || valor === "") return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
};

const arredondar = (valor, casas = 2) =>
  valor === null ? null : Number(valor.toFixed(casas));

const reais = (valor) =>
  `R$ ${Number(valor || 0).toFixed(2).replace(".", ",")}`;

export const piorNivel = (...niveis) =>
  niveis
    .filter(Boolean)
    .reduce((pior, n) => (PESO_NIVEL[n] > PESO_NIVEL[pior] ? n : pior), "OK");

// Configuração efetiva da máquina. Sem "valorJogada" usa valorFicha x fichas
// necessárias (cadastro antigo); sem "jogadasPorPremio" a conferência de
// prêmios fica desligada.
export function configuracaoConferencia(maquina = {}) {
  const valorPulso = numero(maquina.valorPulso) || 1;
  const valorJogadaCadastro = numero(maquina.valorJogada);
  const valorFicha = numero(maquina.valorFicha);
  const fichas = numero(maquina.fichasNecessarias);
  const valorJogada =
    valorJogadaCadastro && valorJogadaCadastro > 0
      ? valorJogadaCadastro
      : valorFicha && fichas
        ? valorFicha * fichas
        : null;
  const jogadasPorPremio = numero(maquina.jogadasPorPremio);

  return {
    valorPulso,
    valorJogada,
    jogadasPorPremio: jogadasPorPremio && jogadasPorPremio > 0 ? jogadasPorPremio : null,
  };
}

// anterior: { contadorIn, contadorOut, dataColeta } da leitura anterior.
// atual: { contadorIn, contadorOut, dataColeta } da leitura nova.
// periodo: somas das movimentações entre as duas leituras (inclui a atual):
//   { digital, fisicoContado, premiosEstoque, digitalPendente }
export function calcularConferencia({ maquina, anterior, atual, periodo = {} }) {
  const config = configuracaoConferencia(maquina);
  const alertas = [];
  const alertar = (nivel, tipo, mensagem) => alertas.push({ nivel, tipo, mensagem });

  const inAtual = numero(atual?.contadorIn);
  const outAtual = numero(atual?.contadorOut);
  const inAnterior = numero(anterior?.contadorIn);
  const outAnterior = numero(anterior?.contadorOut);

  const base = {
    config,
    periodo: {
      de: anterior?.dataColeta || null,
      ate: atual?.dataColeta || null,
    },
    contadores: {
      inAnterior,
      inAtual,
      outAnterior,
      outAtual,
    },
  };

  if (inAtual === null || outAtual === null) {
    return {
      ...base,
      nivel: "OK",
      status: "SEM_LEITURA",
      alertas: [],
      resumo: "Sem leitura dos contadores IN/OUT nesta coleta.",
    };
  }

  if (inAnterior === null || outAnterior === null) {
    return {
      ...base,
      nivel: "OK",
      status: "PRIMEIRA_LEITURA",
      alertas: [],
      resumo:
        "Primeira leitura de relógio desta máquina: ela vira a base para a próxima conferência.",
    };
  }

  const pulsos = inAtual - inAnterior;
  const premiosSaida = outAtual - outAnterior;

  if (pulsos < 0 || premiosSaida < 0) {
    alertar(
      "URGENTE",
      "CONTADOR_VOLTOU",
      `Contador ${pulsos < 0 ? "IN" : "OUT"} menor que a leitura anterior — foi zerado, trocado ou a leitura está errada. Confira a foto.`,
    );
    return {
      ...base,
      nivel: "URGENTE",
      status: "CONTADOR_INVALIDO",
      pulsos,
      premiosSaida,
      alertas,
      resumo: alertas[0].mensagem,
    };
  }

  const receitaContador = pulsos * config.valorPulso;
  const digital = numero(periodo.digital);
  const fisicoEsperado =
    digital === null ? null : Math.max(0, receitaContador - digital);
  const fisicoContado = numero(periodo.fisicoContado);
  const diferencaDinheiro =
    fisicoEsperado !== null && fisicoContado !== null
      ? fisicoContado - fisicoEsperado
      : null;

  // ---- Dinheiro ----
  if (periodo.digitalPendente) {
    alertar(
      "LEVE",
      "DIGITAL_PENDENTE",
      "Valor digital da Machine Pay ainda não foi buscado — o dinheiro físico esperado é provisório.",
    );
  }

  if (digital !== null && digital > receitaContador + Math.max(2, receitaContador * 0.05)) {
    alertar(
      "URGENTE",
      "DIGITAL_MAIOR_QUE_CONTADOR",
      `Machine Pay registrou ${reais(digital)}, mas o contador IN só somou ${reais(receitaContador)}. O contador não está contando os créditos digitais ou a leitura está errada.`,
    );
  }

  if (diferencaDinheiro !== null) {
    const toleranciaLeve = Math.max(5, fisicoEsperado * 0.05);
    const toleranciaUrgente = Math.max(20, fisicoEsperado * 0.2);
    if (diferencaDinheiro < -toleranciaUrgente) {
      alertar(
        "URGENTE",
        "DINHEIRO_FALTANDO",
        `Faltam ${reais(-diferencaDinheiro)} de dinheiro físico: esperado ${reais(fisicoEsperado)}, contado ${reais(fisicoContado)}.`,
      );
    } else if (diferencaDinheiro < -toleranciaLeve) {
      alertar(
        "LEVE",
        "DINHEIRO_FALTANDO",
        `Diferença de ${reais(-diferencaDinheiro)} a menos no dinheiro físico (esperado ${reais(fisicoEsperado)}, contado ${reais(fisicoContado)}).`,
      );
    } else if (diferencaDinheiro > toleranciaUrgente) {
      alertar(
        "LEVE",
        "DINHEIRO_SOBRANDO",
        `Sobraram ${reais(diferencaDinheiro)} de dinheiro físico além do contador — o contador IN pode não estar contando tudo.`,
      );
    }
  }

  // ---- Prêmios ----
  const jogadas = config.valorJogada ? receitaContador / config.valorJogada : null;
  const premiosEsperados =
    jogadas !== null && config.jogadasPorPremio
      ? jogadas / config.jogadasPorPremio
      : null;

  if (premiosEsperados !== null) {
    // Prêmio é inteiro: até o arredondamento para cima está dentro do configurado.
    const limiteOk = Math.ceil(premiosEsperados - 1e-9);
    const excesso = premiosSaida - limiteOk;
    const limiteUrgente = Math.max(2, Math.ceil(premiosEsperados * 0.5));

    if (excesso > limiteUrgente) {
      alertar(
        "URGENTE",
        "PREMIOS_ACIMA",
        `Saíram ${premiosSaida} prêmios, mas o configurado para ${reais(receitaContador)} é ${arredondar(premiosEsperados, 1)}. Máquina pagando muito acima — reconfigure a garra/pagamento.`,
      );
    } else if (excesso > 0) {
      alertar(
        "LEVE",
        "PREMIOS_ACIMA",
        `Saíram ${premiosSaida} prêmios, ${excesso} a mais que o esperado (${arredondar(premiosEsperados, 1)}). Fique de olho na configuração.`,
      );
    } else if (premiosEsperados >= 4 && premiosSaida < Math.floor(premiosEsperados * 0.5)) {
      alertar(
        "LEVE",
        "PREMIOS_ABAIXO",
        `Saíram só ${premiosSaida} prêmios de ${arredondar(premiosEsperados, 1)} esperados — a máquina está pagando abaixo do configurado (garra fraca afasta clientes).`,
      );
    }
  }

  const premiosEstoque = numero(periodo.premiosEstoque);
  if (premiosEstoque !== null && Math.abs(premiosEstoque - premiosSaida) > 1) {
    alertar(
      "LEVE",
      "OUT_DIFERENTE_ESTOQUE",
      `Contador OUT marcou ${premiosSaida} prêmios, mas a contagem de pelúcias deu ${premiosEstoque} saídas.`,
    );
  }

  const nivel = piorNivel(...alertas.map((a) => a.nivel));

  const partes = [
    `${pulsos} pulsos = ${reais(receitaContador)}`,
    digital !== null ? `digital ${reais(digital)}` : null,
    fisicoEsperado !== null ? `físico esperado ${reais(fisicoEsperado)}` : null,
    premiosEsperados !== null
      ? `prêmios ${premiosSaida}/${arredondar(premiosEsperados, 1)} esperados`
      : `prêmios ${premiosSaida}`,
  ].filter(Boolean);

  return {
    ...base,
    nivel,
    status: "CONFERIDA",
    pulsos,
    receitaContador: arredondar(receitaContador),
    digital: arredondar(digital),
    fisicoEsperado: arredondar(fisicoEsperado),
    fisicoContado: arredondar(fisicoContado),
    diferencaDinheiro: arredondar(diferencaDinheiro),
    jogadas: arredondar(jogadas, 1),
    premiosEsperados: arredondar(premiosEsperados, 2),
    premiosSaida,
    premiosEstoque,
    alertas,
    resumo: partes.join(" · "),
  };
}
