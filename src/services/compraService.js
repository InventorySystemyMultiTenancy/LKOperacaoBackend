import { Op } from "sequelize";
import {
  sequelize,
  Compra,
  CompraItem,
  Fornecedor,
  Produto,
  Loja,
  EstoqueLoja,
  MovimentacaoEstoqueLoja,
  MovimentacaoEstoqueLojaProduto,
  MovimentacaoEstoqueBase,
} from "../models/index.js";
import { custoMedioAtualizado } from "../utils/custoMedio.js";

const erro = (status, message) => Object.assign(new Error(message), { status });
const reais = (v) => Math.round((Number(v) || 0) * 100) / 100;

const hojeBrasil = () => new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);

// Estoque que já existe do produto: base + todos os pontos
async function estoqueTotalProduto(produto, transaction) {
  const nasLojas = await EstoqueLoja.sum("quantidade", {
    where: { produtoId: produto.id },
    transaction,
  });
  return Math.max(0, Number(produto.estoqueAtual) || 0) + Math.max(0, Number(nasLojas) || 0);
}

// Entrada/saída no estoque de um ponto, registrada no histórico da loja
async function movimentarEstoqueLoja({ lojaId, itens, usuarioId, observacao, tipo, transaction }) {
  if (!itens.length) return;
  const mov = await MovimentacaoEstoqueLoja.create(
    { lojaId, usuarioId, observacao, dataMovimentacao: new Date() },
    { transaction },
  );
  for (const item of itens) {
    await MovimentacaoEstoqueLojaProduto.create(
      {
        movimentacaoEstoqueLojaId: mov.id,
        produtoId: item.produtoId,
        quantidade: item.quantidade,
        tipoMovimentacao: tipo,
      },
      { transaction },
    );
    const estoque = await EstoqueLoja.findOne({
      where: { lojaId, produtoId: item.produtoId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    const delta = tipo === "entrada" ? item.quantidade : -item.quantidade;
    if (estoque) {
      if (estoque.quantidade + delta < 0) {
        throw erro(400, "Estoque do ponto insuficiente para desfazer esta compra.");
      }
      await estoque.update({ quantidade: estoque.quantidade + delta }, { transaction });
    } else if (delta > 0) {
      await EstoqueLoja.create({ lojaId, produtoId: item.produtoId, quantidade: delta }, { transaction });
    } else {
      throw erro(400, "Estoque do ponto insuficiente para desfazer esta compra.");
    }
  }
}

async function resolverFornecedor({ fornecedorId, fornecedorNome }, transaction) {
  if (fornecedorId) {
    const f = await Fornecedor.findByPk(fornecedorId, { transaction });
    if (!f) throw erro(404, "Fornecedor não encontrado");
    return f;
  }
  const nome = String(fornecedorNome || "").trim();
  if (!nome) return null;
  const existente = await Fornecedor.findOne({ where: { nome: { [Op.iLike]: nome } }, transaction });
  return existente || Fornecedor.create({ nome }, { transaction });
}

const normalizarItens = (itens) => {
  if (!Array.isArray(itens) || !itens.length) throw erro(400, "Adicione pelo menos um produto");
  return itens.map((item) => {
    const quantidade = Math.trunc(Number(item.quantidade));
    const custoUnitario = reais(String(item.custoUnitario ?? "").replace(",", "."));
    if (!item.produtoId) throw erro(400, "Escolha o produto de todos os itens");
    if (!Number.isFinite(quantidade) || quantidade < 1) throw erro(400, "Quantidade inválida");
    if (!Number.isFinite(custoUnitario) || custoUnitario < 0) throw erro(400, "Preço inválido");
    return { produtoId: item.produtoId, quantidade, custoUnitario, lojaId: item.lojaId || null };
  });
};

// Registra a compra: atualiza o custo médio de cada produto e coloca no
// estoque do ponto escolhido ou no estoque da base.
export async function registrarCompra({ usuario, dados }) {
  const itens = normalizarItens(dados.itens);
  const data = /^\d{4}-\d{2}-\d{2}$/.test(dados.data || "") ? dados.data : hojeBrasil();

  const lojasIds = [...new Set(itens.map((i) => i.lojaId).filter(Boolean))];
  if (lojasIds.length) {
    const lojas = await Loja.count({ where: { id: lojasIds } });
    if (lojas !== lojasIds.length) throw erro(404, "Ponto (loja) não encontrado");
  }

  const compraId = await sequelize.transaction(async (transaction) => {
    const fornecedor = await resolverFornecedor(dados, transaction);
    const total = reais(itens.reduce((s, i) => s + i.quantidade * i.custoUnitario, 0));
    const compra = await Compra.create(
      {
        data,
        fornecedorId: fornecedor?.id || null,
        fornecedorNome: fornecedor?.nome || null,
        usuarioId: usuario.id,
        usuarioNome: usuario.nome || null,
        total,
        observacao: dados.observacao || null,
      },
      { transaction },
    );

    for (const item of itens) {
      const produto = await Produto.findByPk(item.produtoId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!produto) throw erro(404, "Produto não encontrado");

      const novoCusto = custoMedioAtualizado({
        estoqueAnterior: await estoqueTotalProduto(produto, transaction),
        custoAnterior: produto.custoUnitario,
        quantidade: item.quantidade,
        custoUnitario: item.custoUnitario,
      });

      await CompraItem.create(
        { ...item, compraId: compra.id, total: reais(item.quantidade * item.custoUnitario) },
        { transaction },
      );

      const atualizacao = { custoUnitario: novoCusto };
      if (!item.lojaId) {
        atualizacao.estoqueAtual = (Number(produto.estoqueAtual) || 0) + item.quantidade;
        await MovimentacaoEstoqueBase.create(
          {
            produtoId: produto.id,
            tipo: "compra",
            quantidade: item.quantidade,
            compraId: compra.id,
            usuarioId: usuario.id,
            observacao: fornecedor ? `Compra — ${fornecedor.nome}` : "Compra",
          },
          { transaction },
        );
      }
      await produto.update(atualizacao, { transaction });
    }

    for (const lojaId of lojasIds) {
      await movimentarEstoqueLoja({
        lojaId,
        itens: itens.filter((i) => i.lojaId === lojaId),
        usuarioId: usuario.id,
        observacao: `Compra${fornecedor ? ` — ${fornecedor.nome}` : ""}`,
        tipo: "entrada",
        transaction,
      });
    }
    return compra.id;
  });

  return obterCompra(compraId);
}

// Produtos comprados sem ponto saem da base para o estoque de um ponto
export async function enviarParaLoja({ usuario, lojaId, itens }) {
  const loja = await Loja.findByPk(lojaId);
  if (!loja) throw erro(404, "Ponto (loja) não encontrado");
  const lista = (itens || [])
    .map((i) => ({ produtoId: i.produtoId, quantidade: Math.trunc(Number(i.quantidade)) }))
    .filter((i) => i.produtoId && i.quantidade > 0);
  if (!lista.length) throw erro(400, "Informe a quantidade de pelo menos um produto");

  await sequelize.transaction(async (transaction) => {
    for (const item of lista) {
      const produto = await Produto.findByPk(item.produtoId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!produto) throw erro(404, "Produto não encontrado");
      const saldo = Number(produto.estoqueAtual) || 0;
      if (saldo < item.quantidade) {
        throw erro(400, `${produto.nome}: só há ${saldo} no estoque da base`);
      }
      await produto.update({ estoqueAtual: saldo - item.quantidade }, { transaction });
      await MovimentacaoEstoqueBase.create(
        {
          produtoId: produto.id,
          tipo: "envio_loja",
          quantidade: -item.quantidade,
          lojaId,
          usuarioId: usuario.id,
          observacao: `Enviado para ${loja.nome}`,
        },
        { transaction },
      );
    }
    await movimentarEstoqueLoja({
      lojaId,
      itens: lista,
      usuarioId: usuario.id,
      observacao: "Recebido do estoque da base",
      tipo: "entrada",
      transaction,
    });
  });

  return { lojaId, loja: loja.nome, itens: lista };
}

// Desfaz a compra (estoque volta). O custo médio não é recalculado.
export async function excluirCompra({ usuario, id }) {
  const compra = await Compra.findByPk(id, { include: [{ model: CompraItem, as: "itens" }] });
  if (!compra) throw erro(404, "Compra não encontrada");

  await sequelize.transaction(async (transaction) => {
    const porLoja = new Map();
    for (const item of compra.itens) {
      if (item.lojaId) {
        porLoja.set(item.lojaId, [...(porLoja.get(item.lojaId) || []), item]);
        continue;
      }
      const produto = await Produto.findByPk(item.produtoId, { transaction, lock: transaction.LOCK.UPDATE });
      const saldo = Number(produto?.estoqueAtual) || 0;
      if (saldo < item.quantidade) {
        throw erro(400, `${produto?.nome || "Produto"}: parte desta compra já saiu da base`);
      }
      await produto.update({ estoqueAtual: saldo - item.quantidade }, { transaction });
      await MovimentacaoEstoqueBase.create(
        {
          produtoId: item.produtoId,
          tipo: "ajuste",
          quantidade: -item.quantidade,
          usuarioId: usuario.id,
          observacao: "Compra excluída",
        },
        { transaction },
      );
    }
    for (const [lojaId, itens] of porLoja) {
      await movimentarEstoqueLoja({
        lojaId,
        itens: itens.map((i) => ({ produtoId: i.produtoId, quantidade: i.quantidade })),
        usuarioId: usuario.id,
        observacao: "Compra excluída",
        tipo: "saida",
        transaction,
      });
    }
    await CompraItem.destroy({ where: { compraId: id }, transaction });
    await compra.destroy({ transaction });
  });
}

const includeCompra = [
  { model: Fornecedor, as: "fornecedor", attributes: ["id", "nome", "telefone"] },
  {
    model: CompraItem,
    as: "itens",
    include: [
      { model: Produto, as: "produto", attributes: ["id", "nome", "codigo", "emoji"] },
      { model: Loja, as: "loja", attributes: ["id", "nome"] },
    ],
  },
];

export async function obterCompra(id) {
  const compra = await Compra.findByPk(id, { include: includeCompra });
  if (!compra) throw erro(404, "Compra não encontrada");
  return compra;
}

export async function listarCompras({ limite = 50, fornecedorId } = {}) {
  return Compra.findAll({
    where: fornecedorId ? { fornecedorId } : {},
    include: includeCompra,
    order: [["data", "DESC"], ["createdAt", "DESC"]],
    limit: Math.min(Number(limite) || 50, 200),
  });
}

// Estoque da base: produtos comprados ainda sem ponto
export async function estoqueBase() {
  const produtos = await Produto.findAll({
    where: { estoqueAtual: { [Op.gt]: 0 } },
    attributes: ["id", "nome", "codigo", "emoji", "estoqueAtual", "custoUnitario"],
    order: [["nome", "ASC"]],
  });
  const itens = produtos.map((p) => ({
    produtoId: p.id,
    nome: p.nome,
    codigo: p.codigo,
    emoji: p.emoji,
    quantidade: Number(p.estoqueAtual) || 0,
    custoUnitario: Number(p.custoUnitario) || 0,
    valor: reais((Number(p.estoqueAtual) || 0) * (Number(p.custoUnitario) || 0)),
  }));
  return {
    itens,
    totalUnidades: itens.reduce((s, i) => s + i.quantidade, 0),
    valorTotal: reais(itens.reduce((s, i) => s + i.valor, 0)),
  };
}

// Último preço de cada produto em cada fornecedor (para comprar de novo)
export async function ultimosPrecos() {
  const itens = await CompraItem.findAll({
    include: [
      {
        model: Compra,
        as: "compra",
        attributes: ["data", "fornecedorId", "fornecedorNome", "createdAt"],
      },
      { model: Produto, as: "produto", attributes: ["id", "nome", "emoji", "codigo"] },
    ],
    order: [[{ model: Compra, as: "compra" }, "data", "DESC"], ["createdAt", "DESC"]],
    limit: 2000,
  });
  const vistos = new Map();
  for (const item of itens) {
    const chave = `${item.compra?.fornecedorId || "-"}:${item.produtoId}`;
    if (vistos.has(chave)) continue;
    vistos.set(chave, {
      fornecedorId: item.compra?.fornecedorId || null,
      fornecedorNome: item.compra?.fornecedorNome || "Sem fornecedor",
      produtoId: item.produtoId,
      produtoNome: item.produto?.nome || "Produto",
      emoji: item.produto?.emoji || "🧸",
      custoUnitario: Number(item.custoUnitario),
      quantidade: item.quantidade,
      data: item.compra?.data,
    });
  }
  return [...vistos.values()].sort(
    (a, b) => a.fornecedorNome.localeCompare(b.fornecedorNome) || a.produtoNome.localeCompare(b.produtoNome),
  );
}

export const listarFornecedores = () =>
  Fornecedor.findAll({ where: { ativo: true }, order: [["nome", "ASC"]] });

export async function salvarFornecedor(id, dados) {
  const nome = String(dados.nome || "").trim();
  if (!nome) throw erro(400, "Informe o nome do fornecedor");
  const valores = { nome, telefone: dados.telefone || null, observacao: dados.observacao || null };
  if (!id) return Fornecedor.create(valores);
  const f = await Fornecedor.findByPk(id);
  if (!f) throw erro(404, "Fornecedor não encontrado");
  return f.update({ ...valores, ativo: dados.ativo ?? f.ativo });
}
