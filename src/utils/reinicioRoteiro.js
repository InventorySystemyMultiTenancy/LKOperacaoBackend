// Reinício automático de roteiros: quando o roteiro volta a ficar "pendente".
//
// reinicio = {
//   modo: "diario" | "dias_semana" | "intervalo" | "nunca",
//   diasSemana: [0..6]      // dias_semana: 0 = domingo ... 6 = sábado
//   intervaloDias: N        // intervalo: a cada N dias
//   inicio: "AAAA-MM-DD"    // intervalo: primeiro dia da contagem
//   hora: "HH:MM"           // horário do reinício (Brasília)
// }
//
// Horários em Brasília (UTC-3, sem horário de verão desde 2019).

export const MODOS_REINICIO = ["diario", "dias_semana", "intervalo", "nunca"];
export const NOMES_DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const OFFSET_BRASILIA = "-03:00";
const DIA_MS = 24 * 60 * 60 * 1000;

export class ReinicioInvalidoError extends Error {
  constructor(message) {
    super(message);
    this.name = "ReinicioInvalidoError";
    this.status = 400;
  }
}

// "AAAA-MM-DD" do dia em Brasília
export const diaBrasilia = (data = new Date()) =>
  new Date(data.getTime() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);

const instante = (dia, hora) => new Date(`${dia}T${hora}:00${OFFSET_BRASILIA}`);

const somarDias = (dia, n) =>
  new Date(Date.parse(`${dia}T12:00:00Z`) + n * DIA_MS).toISOString().slice(0, 10);

const diaDaSemana = (dia) => new Date(`${dia}T12:00:00Z`).getUTCDay();

// Valida e limpa o que veio da tela. null = sem configuração própria.
export function normalizarReinicio(entrada) {
  if (entrada === null || entrada === undefined) return null;
  if (typeof entrada !== "object") throw new ReinicioInvalidoError("Reinício inválido");

  const modo = entrada.modo;
  if (!MODOS_REINICIO.includes(modo)) {
    throw new ReinicioInvalidoError("Escolha como o roteiro reinicia");
  }

  const hora = /^([01]\d|2[0-3]):[0-5]\d$/.test(entrada.hora || "") ? entrada.hora : "00:00";

  if (modo === "nunca") return { modo };
  if (modo === "diario") return { modo, hora };

  if (modo === "dias_semana") {
    const dias = [...new Set((entrada.diasSemana || []).map(Number))]
      .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
      .sort((a, b) => a - b);
    if (!dias.length) throw new ReinicioInvalidoError("Escolha pelo menos um dia da semana");
    return { modo, diasSemana: dias, hora };
  }

  const intervaloDias = Number(entrada.intervaloDias);
  if (!Number.isInteger(intervaloDias) || intervaloDias < 1 || intervaloDias > 60) {
    throw new ReinicioInvalidoError("O intervalo deve ser de 1 a 60 dias");
  }
  const inicio = /^\d{4}-\d{2}-\d{2}$/.test(entrada.inicio || "") ? entrada.inicio : diaBrasilia();
  return { modo, intervaloDias, inicio, hora };
}

// Último horário de reinício agendado que já passou (<= agora), ou null.
export function ultimoReinicioAgendado(reinicio, agora = new Date()) {
  if (!reinicio || reinicio.modo === "nunca") return null;
  const hora = reinicio.hora || "00:00";
  const hoje = diaBrasilia(agora);

  if (reinicio.modo === "diario") {
    const deHoje = instante(hoje, hora);
    return deHoje <= agora ? deHoje : instante(somarDias(hoje, -1), hora);
  }

  if (reinicio.modo === "dias_semana") {
    for (let i = 0; i <= 7; i += 1) {
      const dia = somarDias(hoje, -i);
      if (!reinicio.diasSemana?.includes(diaDaSemana(dia))) continue;
      const momento = instante(dia, hora);
      if (momento <= agora) return momento;
    }
    return null;
  }

  if (reinicio.modo === "intervalo") {
    const primeiro = instante(reinicio.inicio, hora);
    if (primeiro > agora) return null;
    const passos = Math.floor((agora - primeiro) / (reinicio.intervaloDias * DIA_MS));
    const dia = somarDias(reinicio.inicio, passos * reinicio.intervaloDias);
    const momento = instante(dia, hora);
    return momento <= agora
      ? momento
      : instante(somarDias(dia, -reinicio.intervaloDias), hora);
  }

  return null;
}

// Próximo reinício (> agora), para mostrar na tela.
export function proximoReinicio(reinicio, agora = new Date()) {
  if (!reinicio || reinicio.modo === "nunca") return null;
  const hora = reinicio.hora || "00:00";
  const hoje = diaBrasilia(agora);

  if (reinicio.modo === "intervalo") {
    const primeiro = instante(reinicio.inicio, hora);
    if (primeiro > agora) return primeiro;
    const ultimo = ultimoReinicioAgendado(reinicio, agora);
    return new Date(ultimo.getTime() + reinicio.intervaloDias * DIA_MS);
  }

  for (let i = 0; i <= 8; i += 1) {
    const dia = somarDias(hoje, i);
    if (reinicio.modo === "dias_semana" && !reinicio.diasSemana?.includes(diaDaSemana(dia))) {
      continue;
    }
    const momento = instante(dia, hora);
    if (momento > agora) return momento;
  }
  return null;
}

// O roteiro deve voltar a "pendente" agora? Só se um reinício agendado passou
// depois do último reinício feito (ou da criação do roteiro).
export function deveReiniciar(reinicio, referencia, agora = new Date()) {
  const agendado = ultimoReinicioAgendado(reinicio, agora);
  if (!agendado) return false;
  const base = referencia ? new Date(referencia) : null;
  return !base || base < agendado;
}

export function vezesPorSemana(reinicio) {
  if (!reinicio) return 0;
  if (reinicio.modo === "diario") return 7;
  if (reinicio.modo === "dias_semana") return reinicio.diasSemana?.length || 0;
  if (reinicio.modo === "intervalo") return Number((7 / reinicio.intervaloDias).toFixed(1));
  return 0;
}

export function descreverReinicio(reinicio) {
  if (!reinicio) return "Reinicia toda segunda-feira (padrão)";
  const hora = reinicio.hora || "00:00";
  if (reinicio.modo === "nunca") return "Não reinicia sozinho";
  if (reinicio.modo === "diario") return `Reinicia todo dia às ${hora}`;
  if (reinicio.modo === "dias_semana") {
    const dias = reinicio.diasSemana.map((d) => NOMES_DIAS[d]).join(", ");
    const vezes = reinicio.diasSemana.length;
    return `Reinicia ${dias} às ${hora} (${vezes}x por semana)`;
  }
  return reinicio.intervaloDias === 1
    ? `Reinicia todo dia às ${hora}`
    : `Reinicia a cada ${reinicio.intervaloDias} dias às ${hora}`;
}

// Categoria de roteiros antigos (sem categoria salva), pelo nome.
export const CATEGORIAS_PADRAO = ["Dias da Semana", "Bolinhas", "Gigantes"];

export function categoriaDoRoteiro(roteiro) {
  if (roteiro?.categoria) return roteiro.categoria;
  const zona = String(roteiro?.zona || "").toLowerCase();
  if (/^(segunda|terça|terca|quarta|quinta|sexta|sábado|sabado|domingo)/.test(zona)) {
    return "Dias da Semana";
  }
  if (zona.startsWith("bolinha")) return "Bolinhas";
  if (zona.includes("gigante")) return "Gigantes";
  if (zona === "roteiro coringa") return "Coringa";
  return "Outros";
}
