import OpenAI from "openai";

// Leitura dos contadores (relógios) IN/OUT de uma máquina a partir de foto,
// usando visão da OpenAI. O resultado é sempre conferido pelo operador antes
// de salvar: a tela preenche os campos e destaca a confiança da leitura.

export class LeituraRelogioError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "LeituraRelogioError";
    this.status = status;
  }
}

// Modelo com visão; pode ser trocado sem mexer no código (OPENAI_MODEL).
const MODELO = () => process.env.OPENAI_MODEL || "gpt-4o";
const TIPOS_IMAGEM = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_FOTOS = 3;

const SCHEMA_LEITURA = {
  type: "object",
  additionalProperties: false,
  required: ["contadorIn", "contadorOut", "confianca", "observacao"],
  properties: {
    contadorIn: {
      type: ["integer", "null"],
      description: "Valor do contador de ENTRADA (IN / crédito / moedas). null se não estiver visível.",
    },
    contadorOut: {
      type: ["integer", "null"],
      description: "Valor do contador de SAÍDA (OUT / prêmio). null se não estiver visível.",
    },
    confianca: {
      type: "string",
      enum: ["alta", "media", "baixa"],
      description: "alta = todos os dígitos nítidos; baixa = algum dígito incerto.",
    },
    observacao: {
      type: "string",
      description: "Frase curta em português para o operador (ex: dígito borrado, reflexo).",
    },
  },
};

const INSTRUCOES = `Você lê os contadores (relógios) de máquinas de pelúcia (gruas) para o fechamento de caixa.

Na foto há contadores eletromecânicos ou um display com os totais da máquina:
- ENTRADA: rotulado IN, ENTRADA, CRÉDITO, COIN, MOEDA ou similar — conta os pulsos de dinheiro.
- SAÍDA: rotulado OUT, SAÍDA, PRÊMIO, PRIZE ou similar — conta os prêmios que saíram.

Regras:
- Leia todos os dígitos de cada contador, da esquerda para a direita, incluindo zeros à esquerda (devolva como número inteiro).
- Em contador mecânico, se um dígito está no meio da troca, use o dígito menor.
- Se não houver rótulo, o contador de ENTRADA normalmente é o de valor maior.
- Se um contador não estiver visível ou legível, devolva null nele — nunca invente número.
- confianca "alta" só quando todos os dígitos estão nítidos; "baixa" se algum dígito é incerto.`;

let cliente = null;
const obterCliente = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new LeituraRelogioError(
      503,
      "Leitura por foto não configurada: defina OPENAI_API_KEY no servidor.",
    );
  }
  if (!cliente) cliente = new OpenAI({ timeout: 60_000, maxRetries: 2 });
  return cliente;
};

export const leituraPorFotoConfigurada = () => Boolean(process.env.OPENAI_API_KEY);

// fotos: [{ base64, mediaType }] (base64 puro, sem o prefixo data:)
// referencia: { contadorIn, contadorOut } da última leitura salva, para o
// modelo saber a ordem de grandeza (os contadores só aumentam).
export async function lerRelogioPorFoto({ fotos, referencia }) {
  if (!Array.isArray(fotos) || fotos.length === 0) {
    throw new LeituraRelogioError(400, "Envie ao menos uma foto do relógio.");
  }
  if (fotos.length > MAX_FOTOS) {
    throw new LeituraRelogioError(400, `Envie no máximo ${MAX_FOTOS} fotos.`);
  }
  for (const foto of fotos) {
    if (!foto?.base64 || !TIPOS_IMAGEM.has(foto.mediaType)) {
      throw new LeituraRelogioError(400, "Foto inválida: use JPEG, PNG ou WEBP.");
    }
  }

  const textoReferencia =
    referencia && (referencia.contadorIn != null || referencia.contadorOut != null)
      ? `Última leitura salva desta máquina: ENTRADA ${referencia.contadorIn ?? "?"}, SAÍDA ${referencia.contadorOut ?? "?"}. Os contadores só aumentam; use isso apenas para desfazer dúvidas de dígitos, nunca copie esses valores.`
      : "Não há leitura anterior desta máquina.";

  const conteudo = [
    {
      type: "text",
      text: `${textoReferencia}

Leia os contadores de ENTRADA e SAÍDA ${fotos.length > 1 ? "nestas fotos (podem mostrar contadores diferentes da mesma máquina)" : "nesta foto"}.`,
    },
    ...fotos.map((foto) => ({
      type: "image_url",
      image_url: { url: `data:${foto.mediaType};base64,${foto.base64}`, detail: "high" },
    })),
  ];

  let resposta;
  try {
    resposta = await obterCliente().chat.completions.create({
      model: MODELO(),
      messages: [
        { role: "system", content: INSTRUCOES },
        { role: "user", content: conteudo },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "leitura_relogio", strict: true, schema: SCHEMA_LEITURA },
      },
    });
  } catch (error) {
    if (error instanceof OpenAI.AuthenticationError) {
      throw new LeituraRelogioError(503, "Chave da OpenAI inválida (OPENAI_API_KEY).");
    }
    if (error instanceof OpenAI.RateLimitError) {
      throw new LeituraRelogioError(429, "Limite da OpenAI atingido (muitas leituras ou sem crédito na conta). Tente de novo em alguns segundos.");
    }
    if (error instanceof OpenAI.BadRequestError) {
      throw new LeituraRelogioError(400, `Não foi possível ler a foto: ${error.message}`);
    }
    if (error instanceof OpenAI.APIError) {
      throw new LeituraRelogioError(502, "Serviço de leitura por foto indisponível. Digite os números manualmente.");
    }
    throw error;
  }

  const mensagem = resposta.choices?.[0]?.message;
  if (mensagem?.refusal) {
    throw new LeituraRelogioError(422, "A foto não pôde ser analisada. Digite os números manualmente.");
  }

  let leitura;
  try {
    leitura = JSON.parse(mensagem?.content || "");
  } catch {
    throw new LeituraRelogioError(502, "Leitura da foto veio incompleta. Tente outra foto ou digite os números.");
  }

  const avisos = [];
  if (referencia?.contadorIn != null && leitura.contadorIn != null && leitura.contadorIn < referencia.contadorIn) {
    avisos.push("Contador IN lido é menor que a última leitura — confira a foto.");
  }
  if (referencia?.contadorOut != null && leitura.contadorOut != null && leitura.contadorOut < referencia.contadorOut) {
    avisos.push("Contador OUT lido é menor que a última leitura — confira a foto.");
  }

  return {
    contadorIn: leitura.contadorIn,
    contadorOut: leitura.contadorOut,
    confianca: avisos.length ? "baixa" : leitura.confianca,
    observacao: leitura.observacao,
    avisos,
  };
}
