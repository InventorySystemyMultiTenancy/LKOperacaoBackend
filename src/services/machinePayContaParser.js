// Acha o usr (id do cliente) de uma conta Machine Pay pelo nome, no HTML do
// painel. O painel tem um campo "Cliente" (select/lista) com os clientes do
// login; o id pode estar no value da opção, num data-* ou em links "usr=".
// Os candidatos são sempre confirmados depois (listando as máquinas do usr).

const semAcento = (texto) =>
  String(texto || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

const decodificar = (texto) =>
  String(texto || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const atributos = (tag) => {
  const mapa = {};
  for (const m of tag.matchAll(/([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    mapa[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? "";
  }
  return mapa;
};

const ehId = (valor) => /^\d{1,20}$/.test(String(valor || "").trim());

// Regex que acha o nome no HTML sem acento, ignorando caixa e espaços
// ("Gleison Lucasda Silva" acha "Gleison Lucas da silva").
const regexDoNome = (nome) => {
  const letras = semAcento(nome).toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!letras) return null;
  return new RegExp(letras.split("").join("[\\s._-]{0,3}"), "gi");
};

// Candidatos em ordem de confiança (sem repetir).
export function candidatosUsrPorNome(html, nome, ehDaConta) {
  const candidatos = [];
  const adicionar = (usrId, origem, texto) => {
    const id = String(usrId || "").trim();
    if (ehId(id) && !candidatos.some((c) => c.usrId === id)) {
      candidatos.push({ usrId: id, origem, nome: texto || null });
    }
  };

  // 1) <option value="123">Gleison ...</option> (ou id em data-*)
  for (const m of String(html).matchAll(/<option\b([^>]*)>([\s\S]*?)<\/option>/gi)) {
    const attrs = atributos(m[1]);
    const texto = decodificar(m[2]);
    if (!ehDaConta(texto) && !ehDaConta(attrs.value) && !ehDaConta(attrs.label)) continue;
    const ids = [
      attrs.value,
      attrs["data-id"],
      attrs["data-usr"],
      attrs["data-idusr"],
      attrs["data-cliente"],
      attrs["data-value"],
      attrs.id,
    ];
    for (const id of ids) adicionar(id, "option", texto || attrs.value);
  }

  // O campo "Cliente" é a fonte mais segura: achou nele, não chuta pelo entorno.
  if (candidatos.length) return candidatos;

  // 2) Perto do nome: usr=123, idusr=123, mnu_op_maq(1,123), "id":"123"...
  const regex = regexDoNome(nome);
  if (regex) {
    const base = semAcento(html);
    for (const m of base.matchAll(regex)) {
      const janela = base.slice(Math.max(0, m.index - 400), m.index + m[0].length + 400);
      for (const p of janela.matchAll(/(?:idusr|id_usr|usr)\s*[=:("']+\s*(\d{1,20})/gi)) {
        adicionar(p[1], "proximo-usr", m[0]);
      }
      for (const p of janela.matchAll(/mnu_op_maq\(\s*\d+\s*,\s*(\d{1,20})/gi)) {
        adicionar(p[1], "proximo-menu", m[0]);
      }
      for (const p of janela.matchAll(/["']?(?:id|idcliente|cliente_id|value)["']?\s*[:=]\s*["']?(\d{1,20})/gi)) {
        adicionar(p[1], "proximo-id", m[0]);
      }
    }
  }

  return candidatos;
}

// Trecho do HTML ao redor do nome (para o log quando não achar a conta).
export function trechoAoRedorDoNome(html, nome, tamanho = 600) {
  const regex = regexDoNome(nome);
  if (!regex) return null;
  const base = semAcento(html);
  const m = regex.exec(base);
  if (!m) return null;
  return base
    .slice(Math.max(0, m.index - tamanho / 2), m.index + tamanho / 2)
    .replace(/\s+/g, " ");
}
