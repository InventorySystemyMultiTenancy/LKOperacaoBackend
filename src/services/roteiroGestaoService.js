import { Op } from "sequelize";
import {
  sequelize,
  Roteiro,
  RoteiroLoja,
  RoteiroGasto,
  RoteiroLocalizacao,
  Movimentacao,
  Manutencao,
  ComissaoLoja,
  AReceberLoja,
  Usuario,
} from "../models/index.js";
import {
  normalizarReinicio,
  deveReiniciar,
  proximoReinicio,
  descreverReinicio,
  categoriaDoRoteiro,
  CATEGORIAS_PADRAO,
} from "../utils/reinicioRoteiro.js";

// Os roteiros fixos da semana ficam todos nesta data (a tela de seleção busca
// por ela); o status de cada um é que muda com os reinícios.
export const DATA_ROTEIROS_FIXOS = "2026-02-24";

const erro = (status, message) => Object.assign(new Error(message), { status });

const limparNome = (nome) => String(nome || "").trim().replace(/\s+/g, " ").slice(0, 50);

async function dadosFuncionario(funcionarioId) {
  if (!funcionarioId) return { funcionarioId: null, funcionarioNome: null };
  const funcionario = await Usuario.findByPk(funcionarioId);
  if (!funcionario) throw erro(404, "Funcionário não encontrado");
  return { funcionarioId: funcionario.id, funcionarioNome: funcionario.nome };
}

export const infoReinicio = (roteiro) => ({
  categoria: categoriaDoRoteiro(roteiro),
  reinicioDescricao: descreverReinicio(roteiro.reinicio),
  proximoReinicio: proximoReinicio(roteiro.reinicio)?.toISOString() || null,
});

export async function listarCategorias() {
  const roteiros = await Roteiro.findAll({ attributes: ["zona", "categoria"], raw: true });
  const usadas = roteiros.map(categoriaDoRoteiro).filter((c) => c !== "Outros");
  return [...new Set([...CATEGORIAS_PADRAO, ...usadas])];
}

export async function criarRoteiro({ nome, categoria, funcionarioId, reinicio, observacoes }) {
  const zona = limparNome(nome);
  if (!zona) throw erro(400, "Informe o nome do roteiro");
  const categoriaFinal = limparNome(categoria);
  if (!categoriaFinal) throw erro(400, "Escolha ou crie uma categoria");

  const existente = await Roteiro.findOne({
    where: { data: DATA_ROTEIROS_FIXOS, zona: { [Op.iLike]: zona } },
  });
  if (existente) throw erro(400, `Já existe um roteiro chamado "${existente.zona}"`);

  const roteiro = await Roteiro.create({
    data: DATA_ROTEIROS_FIXOS,
    zona,
    categoria: categoriaFinal,
    reinicio: normalizarReinicio(reinicio),
    ultimoReinicio: new Date(),
    status: "pendente",
    totalMaquinas: 0,
    maquinasConcluidas: 0,
    saldoRestante: 500.0,
    semanaInicio: new Date(),
    observacoes: observacoes || null,
    ...(await dadosFuncionario(funcionarioId)),
  });
  return roteiro;
}

export async function configurarRoteiro(id, { nome, categoria, reinicio }) {
  const roteiro = await Roteiro.findByPk(id);
  if (!roteiro) throw erro(404, "Roteiro não encontrado");

  const updates = {};
  if (nome !== undefined) {
    const zona = limparNome(nome);
    if (!zona) throw erro(400, "Informe o nome do roteiro");
    const duplicado = await Roteiro.findOne({
      where: { data: roteiro.data, zona: { [Op.iLike]: zona }, id: { [Op.ne]: id } },
    });
    if (duplicado) throw erro(400, `Já existe um roteiro chamado "${duplicado.zona}"`);
    updates.zona = zona;
  }
  if (categoria !== undefined) {
    const categoriaFinal = limparNome(categoria);
    if (!categoriaFinal) throw erro(400, "Escolha ou crie uma categoria");
    updates.categoria = categoriaFinal;
  }
  if (reinicio !== undefined) {
    updates.reinicio = normalizarReinicio(reinicio);
    // Conta a partir de agora: mudar a regra não reinicia o roteiro na hora
    updates.ultimoReinicio = new Date();
  }

  await roteiro.update(updates);
  return roteiro;
}

// Exclui o roteiro sem apagar o histórico: coletas, manutenções, comissões e
// valores a receber continuam existindo, só deixam de apontar para o roteiro.
export async function excluirRoteiroMantendoHistorico(id) {
  const roteiro = await Roteiro.findByPk(id);
  if (!roteiro) throw erro(404, "Roteiro não encontrado");

  await sequelize.transaction(async (transaction) => {
    const desvincular = { roteiroId: null };
    const onde = { where: { roteiroId: id }, transaction };
    await Movimentacao.update(desvincular, onde);
    await Manutencao.update(desvincular, onde);
    await ComissaoLoja.update(desvincular, onde);
    await AReceberLoja.update(desvincular, onde);
    await RoteiroGasto.destroy(onde);
    await RoteiroLocalizacao.destroy(onde);
    await RoteiroLoja.destroy(onde);
    await roteiro.destroy({ transaction });
  });

  return { zona: roteiro.zona };
}

// Volta um roteiro a "pendente" (lojas a fazer de novo, orçamento cheio).
export async function reiniciarRoteiro(roteiro, agora = new Date()) {
  await sequelize.transaction(async (transaction) => {
    await Roteiro.update(
      {
        status: "pendente",
        maquinasConcluidas: 0,
        saldoRestante: 500.0,
        semanaInicio: agora,
        ultimoReinicio: agora,
      },
      { where: { id: roteiro.id }, transaction },
    );
    await RoteiroLoja.update(
      { concluida: false },
      { where: { roteiroId: roteiro.id }, transaction },
    );
  });
}

// Job: reinicia os roteiros com regra própria cujo horário já chegou.
export async function executarReiniciosAgendados(agora = new Date()) {
  const roteiros = await Roteiro.findAll({
    where: { reinicio: { [Op.ne]: null } },
  });
  const reiniciados = [];
  for (const roteiro of roteiros) {
    const referencia = roteiro.ultimoReinicio || roteiro.createdAt;
    if (deveReiniciar(roteiro.reinicio, referencia, agora)) {
      await reiniciarRoteiro(roteiro, agora);
      reiniciados.push(roteiro.zona);
    }
  }
  if (reiniciados.length) {
    console.log(`🔁 Roteiros reiniciados: ${reiniciados.join(", ")}`);
  }
  return reiniciados;
}

// Os "Bolinha 1..20" eram criados sozinhos todo dia. Remove os antigos
// (sem categoria = criados automaticamente), mantendo o histórico.
export async function removerBolinhasAutomaticas() {
  try {
    const bolinhas = await Roteiro.findAll({
      where: { categoria: null, zona: { [Op.iLike]: "Bolinha%" } },
      attributes: ["id"],
    });
    for (const bolinha of bolinhas) {
      await excluirRoteiroMantendoHistorico(bolinha.id);
    }
    if (bolinhas.length) {
      console.log(`🧹 ${bolinhas.length} roteiros "Bolinha" automáticos removidos`);
    }
  } catch (error) {
    console.error("[Roteiros] Falha ao remover bolinhas automáticas:", error.message);
  }
}
