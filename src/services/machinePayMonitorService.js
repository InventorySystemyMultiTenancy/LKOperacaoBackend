// Monitoramento dos leitores Machine Pay. O painel só mostra o estado do momento
// (online/offline e o contador "Nx" de quedas do dia), então o histórico é montado
// aqui: a cada coleta comparamos a leitura nova com a anterior e gravamos o status
// atual, o consolidado do dia e os eventos (queda / ficou offline / voltou).

import { Op } from "sequelize";
import {
  Maquina,
  MachinePayStatus,
  MachinePayDiario,
  MachinePayEvento,
  MachinePayConta,
  sequelize,
} from "../models/index.js";
import {
  descobrirUsrPorExtrato,
  listarMaquinasCadastradas,
  obterPaginasPainel,
  MachinePayServiceError,
} from "./machinePayService.js";
import {
  candidatosUsrPorNome,
  trechoAoRedorDoNome,
} from "./machinePayContaParser.js";
import { parsearPainelMaquinas } from "./machinePayPainelParser.js";

const FUSO_HORARIO = "America/Sao_Paulo";

// Se o job ficar parado (deploy, servidor dormindo), não atribuímos o buraco
// inteiro como "tempo offline" — no máximo este tanto por coleta.
const LIMITE_MINUTOS_ENTRE_COLETAS = 20;

// "SEM_SINAL" no painel quase sempre significa "Wi-Fi não informado" (leitores
// WEBSOCKET não reportam), então fica fora da comparação de pior sinal.
const GRAVIDADE_SINAL = { OTIMO: 0, BOM: 1, FRACO: 2, RUIM: 3 };

export const dataBrasil = (data = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO_HORARIO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(data);

// Caixas com "CAIXA LIVRE" no nome não estão instalados em nenhum ponto:
// ficam fora do monitoramento (status, histórico e eventos).
export const ehCaixaLivre = (nomePonto) => /caixa\s*livre/i.test(nomePonto || "");

const piorSinal = (atual, novo) => {
  if (!(novo in GRAVIDADE_SINAL)) return atual || null;
  if (!(atual in GRAVIDADE_SINAL)) return novo;
  return GRAVIDADE_SINAL[novo] > GRAVIDADE_SINAL[atual] ? novo : atual;
};

const usrsDoEnv = () =>
  String(process.env.MACHINE_PAY_USR || "")
    .split(",")
    .map((valor) => valor.trim())
    .filter(Boolean);

export const monitorConfigurado = () =>
  Boolean(
    process.env.MACHINE_PAY_LOGIN_URL &&
      process.env.MACHINE_PAY_LOGIN &&
      process.env.MACHINE_PAY_PASSWORD,
  );

// ---- Conta Machine Pay da empresa ----
// O login do painel enxerga as máquinas de vários clientes. Com
// MACHINE_PAY_CONTA_NOME definido (ex: "Gleison Lucasda Silva"), o sistema
// usa apenas a conta (usr) desse cliente: monitoramento, leitores e cadastro.

export const nomeContaConfigurada = () =>
  String(process.env.MACHINE_PAY_CONTA_NOME || "").trim() || null;

// Compara nomes ignorando acentos, maiúsculas, espaços e pontuação
// ("Gleison Lucasda Silva" == "GLEISON LUCAS DA SILVA").
export const normalizarNomeConta = (nome) =>
  String(nome || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

export const ehDaContaConfigurada = (cliente) => {
  const alvo = normalizarNomeConta(nomeContaConfigurada());
  if (!alvo) return true;
  const nome = normalizarNomeConta(cliente);
  return Boolean(nome) && (nome === alvo || nome.includes(alvo) || alvo.includes(nome));
};

let contaResolvida = null;
// Busca que falhou não é repetida a cada coleta (abre várias páginas do painel)
let ultimaBuscaSemSucesso = 0;
const ESPERA_NOVA_BUSCA_MS = 30 * 60 * 1000;

// Descobre o usr da conta pelo nome do cliente que o painel mostra em cada
// leitor. Procura na listagem geral e nas contas já conhecidas; guarda o
// resultado em machine_pay_contas para não precisar procurar de novo.
export async function resolverContaPorNome({ forcar = false } = {}) {
  const nome = nomeContaConfigurada();
  if (!nome) return null;
  if (contaResolvida && !forcar) return contaResolvida;

  // MACHINE_PAY_USR informado à mão tem prioridade (atalho se a busca falhar)
  const usrManual = usrsDoEnv()[0];
  if (usrManual) {
    contaResolvida = { usrId: usrManual, nome };
    return contaResolvida;
  }

  if (!forcar && Date.now() - ultimaBuscaSemSucesso < ESPERA_NOVA_BUSCA_MS) return null;

  if (!forcar) {
    const salvas = await MachinePayConta.findAll({ raw: true });
    const salva = salvas.find((c) => c.nome && ehDaContaConfigurada(c.nome));
    if (salva) {
      contaResolvida = { usrId: salva.usrId, nome: salva.nome };
      return contaResolvida;
    }
  }

  const candidatos = [undefined, ...usrsDoEnv()];
  for (const usrId of candidatos) {
    let leituras = [];
    try {
      leituras = parsearPainelMaquinas(await listarMaquinasCadastradas({ usrId }));
    } catch (error) {
      console.error("[MachinePay] Falha ao procurar conta por nome:", error.message);
      continue;
    }
    const encontrada = leituras.find((l) => l.usrId && ehDaContaConfigurada(l.cliente));
    if (encontrada) {
      contaResolvida = { usrId: encontrada.usrId, nome: encontrada.cliente };
      await MachinePayConta.bulkCreate(
        [{ usrId: encontrada.usrId, nome: encontrada.cliente?.slice(0, 150) || nome }],
        { updateOnDuplicate: ["nome", "updatedAt"] },
      );
      return contaResolvida;
    }
  }

  // O login enxerga vários clientes, mas a listagem padrão mostra só um: procura
  // o id do cliente no campo "Cliente" e nas páginas do painel, e confirma cada
  // candidato listando as máquinas dele.
  const paginas = await obterPaginasPainel(PAGINAS_BUSCA_CONTA).catch((error) => {
    console.error("[MachinePay] Falha ao abrir o painel para achar a conta:", error.message);
    return [];
  });
  const testados = new Set();
  for (const { caminho, html } of paginas) {
    if (!html) continue;
    for (const candidato of candidatosUsrPorNome(html, nome, ehDaContaConfigurada)) {
      if (testados.has(candidato.usrId)) continue;
      testados.add(candidato.usrId);
      const confirmada = await confirmarConta(candidato.usrId);
      if (confirmada) {
        console.log(
          `[MachinePay] Conta "${nome}" encontrada: usr ${candidato.usrId} (${caminho}, ${candidato.origem})`,
        );
        contaResolvida = { usrId: candidato.usrId, nome: confirmada.nome || candidato.nome || nome };
        await MachinePayConta.bulkCreate(
          [{ usrId: candidato.usrId, nome: contaResolvida.nome.slice(0, 150) }],
          { updateOnDuplicate: ["nome", "updatedAt"] },
        );
        return contaResolvida;
      }
    }
  }

  // Diagnóstico para ajustar a busca: onde o nome aparece no HTML do painel.
  for (const { caminho, html } of paginas) {
    if (!html) {
      console.warn(`[MachinePay] Busca da conta: ${caminho || "/"} não abriu`);
      continue;
    }
    const trecho = trechoAoRedorDoNome(html, nome);
    console.warn(
      `[MachinePay] Busca da conta: ${caminho || "/"} (${html.length} bytes) ${
        trecho ? `→ trecho: ${trecho}` : "→ nome não aparece"
      }`,
    );
  }
  console.warn(`[MachinePay] Candidatos testados sem sucesso: ${[...testados].join(", ") || "nenhum"}`);

  ultimaBuscaSemSucesso = Date.now();
  return null;
}

const PAGINAS_BUSCA_CONTA = [
  "",
  "maquinas.php",
  "maquinas.php?acao=maquinas",
  "index.php",
  "clientes.php",
  "usuarios.php",
];

// Confirma que o usr é da conta: o painel lista as máquinas dele e o nome do
// cliente nelas bate com MACHINE_PAY_CONTA_NOME.
async function confirmarConta(usrId) {
  try {
    const leituras = parsearPainelMaquinas(await listarMaquinasCadastradas({ usrId }));
    const daConta = leituras.filter((l) => !l.cliente || ehDaContaConfigurada(l.cliente));
    if (!leituras.length || daConta.length !== leituras.length) return null;
    return { nome: daConta.find((l) => l.cliente)?.cliente || null };
  } catch {
    return null;
  }
}

// Leitores (POS) da conta configurada, marcando quais já estão cadastrados
// em máquinas do sistema — base da tela "Leitores da conta".
export async function listarLeitoresDaConta() {
  const conta = await resolverContaPorNome();
  if (nomeContaConfigurada() && !conta) {
    throw new MachinePayServiceError(
      404,
      `Conta Machine Pay "${nomeContaConfigurada()}" não encontrada no painel. Confira MACHINE_PAY_CONTA_NOME ou informe o usr em MACHINE_PAY_USR.`,
    );
  }

  const html = await listarMaquinasCadastradas({ usrId: conta?.usrId });
  const leituras = parsearPainelMaquinas(html).filter(
    (l) => !conta || l.usrId === conta.usrId || ehDaContaConfigurada(l.cliente),
  );

  const maquinas = await Maquina.findAll({
    where: { machinePayPosId: { [Op.ne]: null } },
    attributes: ["id", "codigo", "nome", "machinePayPosId", "lojaId"],
    raw: true,
  });
  const porPosId = new Map(
    maquinas.map((m) => [String(m.machinePayPosId).trim(), m]),
  );

  return {
    conta,
    leitores: leituras.map((l) => ({
      posId: l.posId,
      nomePonto: l.nomePonto,
      cliente: l.cliente,
      online: l.online,
      caixaLivre: ehCaixaLivre(l.nomePonto),
      vendasHojeValor: l.vendasHojeValor,
      maquina: porPosId.get(l.posId) || null,
    })),
  };
}

// Máximo de extratos consultados por coleta para descobrir o dono de um posId
// (cada consulta baixa uma página do painel).
const MAX_DESCOBERTAS_POR_COLETA = 5;
// posIds cujo extrato não revelou o dono (caixa sem pagamento no período):
// não repetimos a consulta a cada coleta. Zera quando o servidor reinicia.
const posIdsSemDono = new Set();

// Contas (usr) monitoradas = todas as salvas em machine_pay_contas + as das
// máquinas cadastradas (machinePayUsrId) + MACHINE_PAY_USR (opcional). Uma
// máquina sem usr que ainda não apareceu em nenhuma conta lida tem a conta
// descoberta pelo extrato do posId; toda conta nova é salva e passa a ser lida
// sempre, sem precisar ser descoberta de novo.
async function resolverContasMonitoradas() {
  if (nomeContaConfigurada()) {
    const conta = await resolverContaPorNome();
    const totalCadastradas = await Maquina.count({
      where: { machinePayPosId: { [Op.ne]: null } },
    });
    if (!conta) {
      throw new MachinePayServiceError(
        404,
        `Conta Machine Pay "${nomeContaConfigurada()}" não encontrada no painel. Confira MACHINE_PAY_CONTA_NOME ou informe o usr em MACHINE_PAY_USR.`,
      );
    }
    return { usrs: [conta.usrId], totalCadastradas };
  }

  const [maquinas, contasSalvas] = await Promise.all([
    Maquina.findAll({
      where: { machinePayPosId: { [Op.ne]: null } },
      attributes: ["id", "machinePayPosId", "machinePayUsrId"],
    }),
    MachinePayConta.findAll({ attributes: ["usrId"], raw: true }),
  ]);
  const usrs = new Set([
    ...contasSalvas.map((c) => c.usrId),
    ...usrsDoEnv(),
    ...maquinas.map((m) => m.machinePayUsrId).filter(Boolean),
  ]);

  // Dono já conhecido pela última coleta (machine_pay_status guarda o usr).
  const semUsr = maquinas.filter((m) => !m.machinePayUsrId);
  if (semUsr.length) {
    const conhecidos = await MachinePayStatus.findAll({
      where: { posId: semUsr.map((m) => String(m.machinePayPosId).trim()) },
      attributes: ["posId", "usrId"],
      raw: true,
    });
    const usrPorPosId = new Map(conhecidos.map((s) => [s.posId, s.usrId]));
    let descobertas = 0;

    for (const maquina of semUsr) {
      const posId = String(maquina.machinePayPosId).trim();
      let usrId = usrPorPosId.get(posId);
      if (!usrId && !posIdsSemDono.has(posId) && descobertas < MAX_DESCOBERTAS_POR_COLETA) {
        descobertas += 1;
        usrId = await descobrirUsrPorExtrato(posId).catch(() => null);
        if (!usrId) posIdsSemDono.add(posId);
      }
      if (usrId) {
        usrs.add(usrId);
        await maquina.update({ machinePayUsrId: usrId });
      }
    }
  }

  const salvas = new Set(contasSalvas.map((c) => c.usrId));
  const novas = [...usrs].filter((usrId) => !salvas.has(usrId));
  if (novas.length) {
    await MachinePayConta.bulkCreate(
      novas.map((usrId) => ({ usrId })),
      { ignoreDuplicates: true },
    );
  }

  return { usrs: [...usrs], totalCadastradas: maquinas.length };
}

let coletaEmAndamento = null;
let ultimoErro = null;

export const obterUltimoErroColeta = () => ultimoErro;

export function coletarStatusMachinePay() {
  if (!coletaEmAndamento) {
    coletaEmAndamento = executarColeta()
      .then((resultado) => {
        ultimoErro = null;
        return resultado;
      })
      .catch((error) => {
        ultimoErro = { em: new Date(), mensagem: error.message };
        throw error;
      })
      .finally(() => {
        coletaEmAndamento = null;
      });
  }
  return coletaEmAndamento;
}

async function executarColeta() {
  if (!monitorConfigurado()) {
    throw new MachinePayServiceError(
      500,
      "Monitoramento Machine Pay não configurado (MACHINE_PAY_LOGIN_URL / MACHINE_PAY_LOGIN / MACHINE_PAY_PASSWORD)",
    );
  }

  const { usrs, totalCadastradas } = await resolverContasMonitoradas();
  if (!usrs.length) {
    throw new MachinePayServiceError(
      400,
      totalCadastradas
        ? "Não foi possível descobrir a conta Machine Pay das máquinas cadastradas (nenhum caixa com pagamento no último mês). Preencha o usr em uma máquina ou MACHINE_PAY_USR."
        : "Nenhuma máquina do sistema tem o POS ID da Machine Pay cadastrado. Preencha o POS ID em pelo menos uma máquina.",
    );
  }

  const leituras = [];
  const vistos = new Set();
  const caixasLivres = new Set();
  for (const usrId of usrs) {
    const html = await listarMaquinasCadastradas({ usrId });
    for (const leitura of parsearPainelMaquinas(html)) {
      if (vistos.has(leitura.posId)) continue;
      if (nomeContaConfigurada() && leitura.cliente && !ehDaContaConfigurada(leitura.cliente)) {
        continue;
      }
      vistos.add(leitura.posId);
      if (ehCaixaLivre(leitura.nomePonto)) {
        caixasLivres.add(leitura.posId);
        continue;
      }
      leituras.push({ ...leitura, nomePonto: leitura.nomePonto?.slice(0, 255) || null });
    }
  }

  if (!leituras.length) {
    throw new MachinePayServiceError(
      502,
      "Nenhuma máquina encontrada no painel Machine Pay (layout alterado ou sessão expirada)",
    );
  }

  const agora = new Date();
  const dia = dataBrasil(agora);

  const [anteriores, diariosHoje] = await Promise.all([
    MachinePayStatus.findAll({ raw: true }),
    MachinePayDiario.findAll({ where: { data: dia }, raw: true }),
  ]);
  const statusAnterior = new Map(anteriores.map((s) => [s.posId, s]));
  const diarioAnterior = new Map(diariosHoje.map((d) => [d.posId, d]));

  const linhasStatus = [];
  const linhasDiario = [];
  const eventos = [];

  for (const leitura of leituras) {
    const anterior = statusAnterior.get(leitura.posId);
    const diario = diarioAnterior.get(leitura.posId);

    const minutosDesdeUltima = anterior?.coletadoEm
      ? Math.min(
          (agora - new Date(anterior.coletadoEm)) / 60000,
          LIMITE_MINUTOS_ENTRE_COLETAS,
        )
      : 0;

    const ficouOffline = Boolean(anterior?.online) && !leitura.online;
    const voltou = Boolean(anterior) && !anterior.online && leitura.online;

    let offlineDesde = null;
    if (!leitura.online) {
      offlineDesde = ficouOffline ? agora : anterior?.offlineDesde || null;
    }

    const eventoBase = {
      posId: leitura.posId,
      nomePonto: leitura.nomePonto,
      dataHora: agora,
      data: dia,
      sinalWifi: leitura.sinalWifi,
    };

    if (ficouOffline) eventos.push({ ...eventoBase, tipo: "OFFLINE" });
    if (voltou) {
      eventos.push({
        ...eventoBase,
        tipo: "ONLINE",
        duracaoMinutos: anterior.offlineDesde
          ? Math.round((agora - new Date(anterior.offlineDesde)) / 60000)
          : null,
      });
    }

    // O contador "Nx" zera na virada do dia; só comparamos dentro do mesmo dia.
    const quedasAntes = anterior && anterior.dia === dia ? anterior.quedasHoje : null;
    if (quedasAntes !== null && leitura.quedasHoje > quedasAntes) {
      eventos.push({
        ...eventoBase,
        tipo: "QUEDA",
        quedasAntes,
        quedasDepois: leitura.quedasHoje,
      });
    }

    linhasStatus.push({
      ...leitura,
      dia,
      offlineDesde,
      ultimaVezOnline: leitura.online ? agora : anterior?.ultimaVezOnline || null,
      coletadoEm: agora,
    });

    linhasDiario.push({
      id: `${leitura.posId}_${dia}`,
      posId: leitura.posId,
      data: dia,
      nomePonto: leitura.nomePonto,
      quedas: Math.max(diario?.quedas || 0, leitura.quedasHoje),
      vezesOffline: (diario?.vezesOffline || 0) + (ficouOffline ? 1 : 0),
      minutosOffline:
        (diario?.minutosOffline || 0) +
        (leitura.online ? 0 : Math.round(minutosDesdeUltima)),
      coletas: (diario?.coletas || 0) + 1,
      coletasOffline: (diario?.coletasOffline || 0) + (leitura.online ? 0 : 1),
      piorSinal: piorSinal(diario?.piorSinal, leitura.sinalWifi),
      vendasQtd: Math.max(diario?.vendasQtd || 0, leitura.vendasHojeQtd),
      vendasValor: Math.max(Number(diario?.vendasValor || 0), leitura.vendasHojeValor),
    });
  }

  const posIdsAtuais = leituras.map((l) => l.posId);
  const camposStatus = Object.keys(linhasStatus[0]).filter((c) => c !== "posId");
  const camposDiario = Object.keys(linhasDiario[0]).filter((c) => c !== "id");

  await sequelize.transaction(async (transaction) => {
    await MachinePayStatus.bulkCreate(linhasStatus, {
      updateOnDuplicate: [...camposStatus, "updatedAt"],
      transaction,
    });
    await MachinePayDiario.bulkCreate(linhasDiario, {
      updateOnDuplicate: [...camposDiario, "updatedAt"],
      transaction,
    });
    if (eventos.length) {
      await MachinePayEvento.bulkCreate(eventos, { transaction });
    }
    // Leitores excluídos do painel deixam de aparecer na lista de status
    // (o histórico diário e os eventos deles continuam guardados).
    await MachinePayStatus.destroy({
      where: { posId: { [Op.notIn]: posIdsAtuais } },
      transaction,
    });
    if (caixasLivres.size) {
      const where = { posId: { [Op.in]: [...caixasLivres] } };
      await MachinePayDiario.destroy({ where, transaction });
      await MachinePayEvento.destroy({ where, transaction });
    }
  });

  // Completa o usr das máquinas cadastradas que apareceram nesta leitura
  // (também usado pela consulta de status online/offline da tela da máquina).
  const usrPorPosId = new Map(leituras.map((l) => [l.posId, l.usrId]));
  const maquinasSemUsr = await Maquina.findAll({
    where: { machinePayPosId: { [Op.in]: posIdsAtuais }, machinePayUsrId: null },
    attributes: ["id", "machinePayPosId"],
  });
  for (const maquina of maquinasSemUsr) {
    const usrId = usrPorPosId.get(String(maquina.machinePayPosId).trim());
    if (usrId) await maquina.update({ machinePayUsrId: usrId });
  }

  // Salva/atualiza as contas lidas com o nome do cliente que o painel mostra.
  const nomePorUsr = new Map();
  for (const leitura of leituras) {
    if (leitura.usrId && !nomePorUsr.has(leitura.usrId)) {
      nomePorUsr.set(leitura.usrId, leitura.cliente?.slice(0, 150) || null);
    }
  }
  if (nomePorUsr.size) {
    await MachinePayConta.bulkCreate(
      [...nomePorUsr].map(([usrId, nome]) => ({ usrId, nome })),
      { updateOnDuplicate: ["nome", "updatedAt"] },
    );
  }

  return {
    coletadoEm: agora,
    total: leituras.length,
    online: leituras.filter((l) => l.online).length,
    offline: leituras.filter((l) => !l.online).length,
    eventos: eventos.length,
  };
}

export async function limparHistoricoAntigo() {
  const dias = Number(process.env.MACHINE_PAY_RETENCAO_DIAS) || 365;
  const limite = dataBrasil(new Date(Date.now() - dias * 24 * 60 * 60 * 1000));
  const [eventos, diarios] = await Promise.all([
    MachinePayEvento.destroy({ where: { data: { [Op.lt]: limite } } }),
    MachinePayDiario.destroy({ where: { data: { [Op.lt]: limite } } }),
  ]);
  return { eventos, diarios, limite };
}
