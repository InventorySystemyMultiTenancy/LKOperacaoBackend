import * as db from "../models/index.js";
import { Op } from "sequelize";

// Data de hoje (YYYY-MM-DD) no fuso de Brasília; toISOString() usa UTC e vira o dia seguinte após 21h
const hojeBrasil = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });

/**
 * Controller para gerenciar carrinhos de produtos por usuário
 * 
 * Funcionalidades:
 * - Admin cria carrinho diário para usuários
 * - Sistema desconta automaticamente nas movimentações
 * - Usuário registra devolução ao final do dia
 * - Sistema gera alertas se houver discrepância
 */

// ============================================
// ADMIN: Criar carrinho para usuário
// ============================================
export const criarCarrinho = async (req, res) => {
  const { usuarioId, itens, data, observacao } = req.body;
  // itens = [{ produtoId: "uuid", quantidade: 10 }, { produtoId: "uuid2", quantidade: 20 }]

  if (!usuarioId || !itens || !Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({
      ok: false,
      erro: "usuarioId e itens (array de produtos) são obrigatórios",
    });
  }

  try {
    // Verificar se já existe carrinho para este usuário nesta data
    const dataCarrinho = data || hojeBrasil();
    
    const carrinhoExistente = await db.CarrinhoUsuario.findOne({
      where: {
        usuarioId,
        data: dataCarrinho,
      },
    });

    if (carrinhoExistente) {
      return res.status(400).json({
        ok: false,
        erro: "Já existe um carrinho para este usuário nesta data",
        carrinho: carrinhoExistente,
      });
    }

    // Calcular quantidade total
    const quantidadeTotal = itens.reduce((sum, item) => sum + (item.quantidade || 0), 0);

    // Criar novo carrinho (usar transação para garantir consistência)
    const result = await db.sequelize.transaction(async (t) => {
      const carrinho = await db.CarrinhoUsuario.create({
        usuarioId,
        quantidadeInicial: quantidadeTotal,
        quantidadeAtual: quantidadeTotal,
        data: dataCarrinho,
        ativo: true,
        observacao: observacao || null,
      }, { transaction: t });

      // Criar itens do carrinho
      const itensCarrinho = [];
      for (const item of itens) {
        if (!item.produtoId || !item.quantidade || item.quantidade < 0) {
          throw new Error("Cada item deve ter produtoId e quantidade válida");
        }

        const carrinhoItem = await db.CarrinhoItem.create({
          carrinhoId: carrinho.id,
          produtoId: item.produtoId,
          quantidadeInicial: item.quantidade,
          quantidadeAtual: item.quantidade,
        }, { transaction: t });

        itensCarrinho.push(carrinhoItem);
      }

      return { carrinho, itensCarrinho };
    });

    // Buscar carrinho completo com dados do usuário e produtos
    const carrinhoCompleto = await db.CarrinhoUsuario.findByPk(result.carrinho.id, {
      include: [
        {
          model: db.Usuario,
          as: "usuario",
          attributes: ["id", "nome", "email"],
        },
        {
          model: db.CarrinhoItem,
          as: "itens",
          include: [
            {
              model: db.Produto,
              as: "produto",
              attributes: ["id", "nome", "preco"],
            },
          ],
        },
      ],
    });

    res.json({
      ok: true,
      carrinho: carrinhoCompleto,
      mensagem: "Carrinho criado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao criar carrinho:", error);
    res.status(500).json({ ok: false, erro: error.message });
  }
};

// ============================================
// ADMIN: Listar carrinhos (com filtros)
// ============================================
export const listarCarrinhos = async (req, res) => {
  const { usuarioId, data, ativo } = req.query;

  try {
    const where = {};

    if (usuarioId) where.usuarioId = usuarioId;
    if (data) where.data = data;
    if (ativo !== undefined) where.ativo = ativo === "true";

    const carrinhos = await db.CarrinhoUsuario.findAll({
      where,
      include: [
        {
          model: db.Usuario,
          as: "usuario",
          attributes: ["id", "nome", "email"],
        },
        {
          model: db.CarrinhoItem,
          as: "itens",
          include: [
            {
              model: db.Produto,
              as: "produto",
              attributes: ["id", "nome", "preco"],
            },
          ],
        },
        {
          model: db.DevolucaoCarrinho,
          as: "devolucoes",
          required: false,
          include: [
            {
              model: db.DevolucaoCarrinhoItem,
              as: "itens",
              include: [
                {
                  model: db.Produto,
                  as: "produto",
                  attributes: ["id", "nome"],
                },
              ],
            },
          ],
        },
      ],
      order: [["data", "DESC"], ["createdAt", "DESC"]],
    });

    res.json({ ok: true, carrinhos });
  } catch (error) {
    console.error("Erro ao listar carrinhos:", error);
    res.status(500).json({ ok: false, erro: error.message });
  }
};

// ============================================
// USUARIO: Buscar carrinho ativo atual
// ============================================
export const buscarCarrinhoAtual = async (req, res) => {
  const usuarioId = req.usuario?.id || req.params.usuarioId;

  if (!usuarioId) {
    return res.status(400).json({ ok: false, erro: "usuarioId não fornecido" });
  }

  try {
    const hoje = hojeBrasil();

    const carrinho = await db.CarrinhoUsuario.findOne({
      where: {
        usuarioId,
        data: hoje,
        ativo: true,
      },
      include: [
        {
          model: db.Usuario,
          as: "usuario",
          attributes: ["id", "nome", "email"],
        },
        {
          model: db.CarrinhoItem,
          as: "itens",
          include: [
            {
              model: db.Produto,
              as: "produto",
              attributes: ["id", "nome", "preco"],
            },
          ],
        },
        {
          model: db.DevolucaoCarrinho,
          as: "devolucoes",
          required: false,
          include: [
            {
              model: db.DevolucaoCarrinhoItem,
              as: "itens",
              include: [
                {
                  model: db.Produto,
                  as: "produto",
                  attributes: ["id", "nome"],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!carrinho) {
      return res.status(404).json({
        ok: false,
        erro: "Nenhum carrinho ativo encontrado para hoje",
      });
    }

    res.json({ ok: true, carrinho });
  } catch (error) {
    console.error("Erro ao buscar carrinho atual:", error);
    res.status(500).json({ ok: false, erro: error.message });
  }
};

// ============================================
// ADMIN: Atualizar carrinho (quantidades por produto e/ou status)
// ============================================
export const atualizarCarrinho = async (req, res) => {
  const { id } = req.params;
  // itens = [{ produtoId: "uuid", quantidadeInicial?: 10, quantidadeAtual?: 5 }, ...]
  const { itens, ativo } = req.body;

  try {
    const carrinho = await db.CarrinhoUsuario.findByPk(id, {
      include: [{ model: db.CarrinhoItem, as: "itens" }],
    });

    if (!carrinho) {
      return res.status(404).json({ ok: false, erro: "Carrinho não encontrado" });
    }

    if (itens !== undefined && !Array.isArray(itens)) {
      return res.status(400).json({ ok: false, erro: "itens deve ser um array" });
    }

    await db.sequelize.transaction(async (t) => {
      if (Array.isArray(itens) && itens.length > 0) {
        for (const item of itens) {
          const { produtoId, quantidadeInicial, quantidadeAtual } = item;

          const carrinhoItem = carrinho.itens.find((ci) => ci.produtoId === produtoId);
          if (!carrinhoItem) {
            throw new Error(`Produto ${produtoId} não encontrado neste carrinho`);
          }

          const itemUpdates = {};
          if (quantidadeInicial !== undefined) itemUpdates.quantidadeInicial = quantidadeInicial;
          if (quantidadeAtual !== undefined) itemUpdates.quantidadeAtual = quantidadeAtual;

          if (Object.keys(itemUpdates).length > 0) {
            await carrinhoItem.update(itemUpdates, { transaction: t });
          }
        }

        // Cabeçalho é sempre derivado da soma dos itens (fonte da verdade),
        // nunca editado diretamente, para não desincronizar do detalhe por produto
        const totalInicial = await db.CarrinhoItem.sum("quantidadeInicial", {
          where: { carrinhoId: carrinho.id },
          transaction: t,
        });
        const totalAtual = await db.CarrinhoItem.sum("quantidadeAtual", {
          where: { carrinhoId: carrinho.id },
          transaction: t,
        });

        await carrinho.update(
          {
            quantidadeInicial: totalInicial || 0,
            quantidadeAtual: totalAtual || 0,
            ...(ativo !== undefined ? { ativo } : {}),
          },
          { transaction: t }
        );
      } else if (ativo !== undefined) {
        await carrinho.update({ ativo }, { transaction: t });
      }
    });

    const carrinhoAtualizado = await db.CarrinhoUsuario.findByPk(id, {
      include: [
        {
          model: db.Usuario,
          as: "usuario",
          attributes: ["id", "nome", "email"],
        },
        {
          model: db.CarrinhoItem,
          as: "itens",
          include: [{ model: db.Produto, as: "produto", attributes: ["id", "nome"] }],
        },
      ],
    });

    res.json({
      ok: true,
      carrinho: carrinhoAtualizado,
      mensagem: "Carrinho atualizado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao atualizar carrinho:", error);
    res.status(500).json({ ok: false, erro: error.message });
  }
};

// ============================================
// USUARIO: Registrar devolução de produtos
// ============================================
export const registrarDevolucao = async (req, res) => {
  const { carrinhoId, itens, observacao } = req.body;
  // itens = [{ produtoId: "uuid", quantidadeDevolvida: 5 }, ...]
  const usuarioId = req.usuario?.id || req.body.usuarioId;

  if (!carrinhoId || !itens || !Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({
      ok: false,
      erro: "carrinhoId e itens (array com produtoId e quantidadeDevolvida) são obrigatórios",
    });
  }

  try {
    // Buscar carrinho com itens
    const carrinho = await db.CarrinhoUsuario.findByPk(carrinhoId, {
      include: [
        {
          model: db.CarrinhoItem,
          as: "itens",  
          include: [{ model: db.Produto, as: "produto" }],
        },
        {
          model: db.Usuario,
          as: "usuario",
        },
      ],
    });

    if (!carrinho) {
      return res.status(404).json({ ok: false, erro: "Carrinho não encontrado" });
    }

    // Verificar se já existe devolução para este carrinho
    const devolucaoExistente = await db.DevolucaoCarrinho.findOne({
      where: { carrinhoId },
    });

    if (devolucaoExistente) {
      return res.status(400).json({
        ok: false,
        erro: "Já existe uma devolução registrada para este carrinho",
        devolucao: devolucaoExistente,
      });
    }

    // Validar que todos os produtos do carrinho foram informados na devolução
    // (senão um produto esquecido nunca gera discrepância nem aparece no relatório)
    const produtoIdsInformados = new Set(itens.map((i) => i.produtoId));
    const produtosFaltando = carrinho.itens.filter(
      (ci) => !produtoIdsInformados.has(ci.produtoId)
    );

    if (produtosFaltando.length > 0) {
      return res.status(400).json({
        ok: false,
        erro: "Informe a quantidade devolvida de todos os produtos do carrinho",
        produtosFaltando: produtosFaltando.map((ci) => ({
          produtoId: ci.produtoId,
          produtoNome: ci.produto?.nome,
        })),
      });
    }

    const produtoIdsDoCarrinho = new Set(carrinho.itens.map((ci) => ci.produtoId));
    const produtosInvalidos = itens.filter((i) => !produtoIdsDoCarrinho.has(i.produtoId));

    if (produtosInvalidos.length > 0) {
      return res.status(400).json({
        ok: false,
        erro: "Um ou mais produtos informados não pertencem a este carrinho",
        produtosInvalidos: produtosInvalidos.map((i) => i.produtoId),
      });
    }

    // Usar transação para garantir consistência
    const result = await db.sequelize.transaction(async (t) => {
      // Calcular totais e criar devolução principal
      let quantidadeTotalDevolvida = 0;
      let quantidadeTotalEsperada = 0;
      let temDiscrepancia = false;

      // Criar devolução principal
      const devolucao = await db.DevolucaoCarrinho.create({
        carrinhoId,
        usuarioId,
        quantidadeDevolvida: 0, // Será atualizado depois
        quantidadeEsperada: 0, // Será atualizado depois
        discrepancia: 0, // Será atualizado depois
        alertaAtivo: false, // Será atualizado depois
        observacao: observacao || null,
        dataDevolucao: new Date(),
      }, { transaction: t });

      // Criar itens da devolução
      const itensDevolucao = [];
      for (const itemDevolucao of itens) {
        const { produtoId, quantidadeDevolvida } = itemDevolucao;

        if (!produtoId || quantidadeDevolvida === undefined) {
          throw new Error("Cada item deve ter produtoId e quantidadeDevolvida");
        }

        // Buscar item do carrinho correspondente
        const carrinhoItem = carrinho.itens.find(ci => ci.produtoId === produtoId);
        
        if (!carrinhoItem) {
          throw new Error(`Produto ${produtoId} não encontrado no carrinho`);
        }

        const quantidadeEsperada = carrinhoItem.quantidadeAtual;
        const discrepancia = quantidadeDevolvida - quantidadeEsperada;

        if (discrepancia !== 0) temDiscrepancia = true;

        // Criar item da devolução
        const devolucaoItem = await db.DevolucaoCarrinhoItem.create({
          devolucaoId: devolucao.id,
          produtoId,
          quantidadeDevolvida,
          quantidadeEsperada,
          discrepancia,
        }, { transaction: t });

        quantidadeTotalDevolvida += quantidadeDevolvida;
        quantidadeTotalEsperada += quantidadeEsperada;

        itensDevolucao.push(devolucaoItem);
      }

      // Atualizar devolução principal com totais
      await devolucao.update({
        quantidadeDevolvida: quantidadeTotalDevolvida,
        quantidadeEsperada: quantidadeTotalEsperada,
        discrepancia: quantidadeTotalDevolvida - quantidadeTotalEsperada,
        alertaAtivo: temDiscrepancia,
      }, { transaction: t });

      // Desativar o carrinho
      await carrinho.update({ ativo: false }, { transaction: t });

      return { devolucao, itensDevolucao, temDiscrepancia };
    });

    // Buscar devolução completa com relações
    const devolucaoCompleta = await db.DevolucaoCarrinho.findByPk(result.devolucao.id, {
      include: [
        {
          model: db.CarrinhoUsuario,
          as: "carrinho",
          include: [
            {
              model: db.Usuario,
              as: "usuario",
              attributes: ["id", "nome", "email"],
            },
            {
              model: db.CarrinhoItem,
              as: "itens",
              include: [{ model: db.Produto, as: "produto" }],
            },
          ],
        },
        {
          model: db.Usuario,
          as: "usuario",
          attributes: ["id", "nome", "email"],
        },
        {
          model: db.DevolucaoCarrinhoItem,
          as: "itens",
          include: [{ model: db.Produto, as: "produto" }],
        },
      ],
    });

    const discrepancia = result.devolucao.discrepancia;

    res.json({
      ok: true,
      devolucao: devolucaoCompleta,
      alertaGerado: result.temDiscrepancia,
      mensagem:
        discrepancia === 0
          ? "Devolução registrada com sucesso! Quantidades conferem."
          : `Devolução registrada. ATENÇÃO: Discrepância de ${discrepancia} produtos (${discrepancia > 0 ? "sobra" : "falta"}).`,
    });
  } catch (error) {
    console.error("Erro ao registrar devolução:", error);
    res.status(500).json({ ok: false, erro: error.message });
  }
};

// ============================================
// ADMIN OU EMAILS AUTORIZADOS: Registrar devolução em nome de funcionário
// ============================================
export const registrarDevolucaoPorAdmin = async (req, res) => {
  const { usuarioIdFuncionario, carrinhoId, itens, observacao } = req.body;
  // itens = [{ produtoId: "uuid", quantidadeDevolvida: 5 }, ...]
  const usuarioAutorizadoId = req.usuario?.id;
  const usuarioAutorizadoEmail = req.usuario?.email;

  // Validar parâmetros obrigatórios
  if (!usuarioIdFuncionario || !itens || !Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({
      ok: false,
      erro: "usuarioIdFuncionario e itens (array com produtoId e quantidadeDevolvida) são obrigatórios",
    });
  }

  // Nota: A permissão já foi verificada pelo middleware autorizarAdminOuEmailAutorizado

  try {
    // Usar o carrinho escolhido na tela quando informado; senão, o carrinho ativo de hoje.
    // (a tela lista carrinhos ativos de qualquer data, e "hoje" em UTC vira o dia seguinte após 21h)
    const where = carrinhoId
      ? { id: carrinhoId, usuarioId: usuarioIdFuncionario, ativo: true }
      : {
          usuarioId: usuarioIdFuncionario,
          data: hojeBrasil(),
          ativo: true,
        };

    const carrinho = await db.CarrinhoUsuario.findOne({
      where,
      include: [
        {
          model: db.Usuario,
          as: "usuario",
          attributes: ["id", "nome", "email"],
        },
        {
          model: db.CarrinhoItem,
          as: "itens",
          include: [{ model: db.Produto, as: "produto" }],
        },
      ],
    });

    if (!carrinho) {
      return res.status(404).json({
        ok: false,
        erro: "Nenhum carrinho ativo encontrado para este funcionário hoje",
      });
    }

    // Verificar se já existe devolução para este carrinho
    const devolucaoExistente = await db.DevolucaoCarrinho.findOne({
      where: { carrinhoId: carrinho.id },
    });

    if (devolucaoExistente) {
      return res.status(400).json({
        ok: false,
        erro: "Já existe uma devolução registrada para este carrinho",
        devolucao: devolucaoExistente,
      });
    }

    // Validar que todos os produtos do carrinho foram informados na devolução
    // (senão um produto esquecido nunca gera discrepância nem aparece no relatório)
    const produtoIdsInformados = new Set(itens.map((i) => i.produtoId));
    const produtosFaltando = carrinho.itens.filter(
      (ci) => !produtoIdsInformados.has(ci.produtoId)
    );

    if (produtosFaltando.length > 0) {
      return res.status(400).json({
        ok: false,
        erro: "Informe a quantidade devolvida de todos os produtos do carrinho",
        produtosFaltando: produtosFaltando.map((ci) => ({
          produtoId: ci.produtoId,
          produtoNome: ci.produto?.nome,
        })),
      });
    }

    const produtoIdsDoCarrinho = new Set(carrinho.itens.map((ci) => ci.produtoId));
    const produtosInvalidos = itens.filter((i) => !produtoIdsDoCarrinho.has(i.produtoId));

    if (produtosInvalidos.length > 0) {
      return res.status(400).json({
        ok: false,
        erro: "Um ou mais produtos informados não pertencem a este carrinho",
        produtosInvalidos: produtosInvalidos.map((i) => i.produtoId),
      });
    }

    // Usar transação para garantir consistência
    const result = await db.sequelize.transaction(async (t) => {
      let quantidadeTotalDevolvida = 0;
      let quantidadeTotalEsperada = 0;
      let temDiscrepancia = false;

      // Criar devolução principal
      const devolucao = await db.DevolucaoCarrinho.create({
        carrinhoId: carrinho.id,
        usuarioId: usuarioIdFuncionario, // Devolução em nome do funcionário
        quantidadeDevolvida: 0, // Será atualizado depois
        quantidadeEsperada: 0, // Será atualizado depois
        discrepancia: 0, // Será atualizado depois
        alertaAtivo: false, // Será atualizado depois
        observacao: observacao 
          ? `(Registrado por ${usuarioAutorizadoEmail}) ${observacao}` 
          : `Registrado por ${usuarioAutorizadoEmail}`,
        dataDevolucao: new Date(),
      }, { transaction: t });

      // Criar itens da devolução
      const itensDevolucao = [];
      for (const itemDevolucao of itens) {
        const { produtoId, quantidadeDevolvida } = itemDevolucao;

        if (!produtoId || quantidadeDevolvida === undefined) {
          throw new Error("Cada item deve ter produtoId e quantidadeDevolvida");
        }

        // Buscar item do carrinho correspondente
        const carrinhoItem = carrinho.itens.find(ci => ci.produtoId === produtoId);
        
        if (!carrinhoItem) {
          throw new Error(`Produto ${produtoId} não encontrado no carrinho`);
        }

        const quantidadeEsperada = carrinhoItem.quantidadeAtual;
        const discrepancia = quantidadeDevolvida - quantidadeEsperada;

        if (discrepancia !== 0) temDiscrepancia = true;

        // Criar item da devolução
        const devolucaoItem = await db.DevolucaoCarrinhoItem.create({
          devolucaoId: devolucao.id,
          produtoId,
          quantidadeDevolvida,
          quantidadeEsperada,
          discrepancia,
        }, { transaction: t });

        quantidadeTotalDevolvida += quantidadeDevolvida;
        quantidadeTotalEsperada += quantidadeEsperada;

        itensDevolucao.push(devolucaoItem);
      }

      // Atualizar devolução principal com totais
      await devolucao.update({
        quantidadeDevolvida: quantidadeTotalDevolvida,
        quantidadeEsperada: quantidadeTotalEsperada,
        discrepancia: quantidadeTotalDevolvida - quantidadeTotalEsperada,
        alertaAtivo: temDiscrepancia,
      }, { transaction: t });

      // Desativar o carrinho
      await carrinho.update({ ativo: false }, { transaction: t });

      return { devolucao, itensDevolucao, temDiscrepancia };
    });

    // Buscar devolução completa com relações
    const devolucaoCompleta = await db.DevolucaoCarrinho.findByPk(result.devolucao.id, {
      include: [
        {
          model: db.CarrinhoUsuario,
          as: "carrinho",
          include: [
            {
              model: db.Usuario,
              as: "usuario",
              attributes: ["id", "nome", "email"],
            },
            {
              model: db.CarrinhoItem,
              as: "itens",
              include: [{ model: db.Produto, as: "produto" }],
            },
          ],
        },
        {
          model: db.Usuario,
          as: "usuario",
          attributes: ["id", "nome", "email"],
        },
        {
          model: db.DevolucaoCarrinhoItem,
          as: "itens",
          include: [{ model: db.Produto, as: "produto" }],
        },
      ],
    });

    const discrepancia = result.devolucao.discrepancia;

    res.json({
      ok: true,
      devolucao: devolucaoCompleta,
      alertaGerado: result.temDiscrepancia,
      mensagem:
        discrepancia === 0
          ? `Devolução registrada com sucesso para ${carrinho.usuario.nome}! Quantidades conferem.`
          : `Devolução registrada para ${carrinho.usuario.nome}. ATENÇÃO: Discrepância de ${discrepancia} produtos (${discrepancia > 0 ? "sobra" : "falta"}).`,
    });
  } catch (error) {
    console.error("Erro ao registrar devolução por usuário autorizado:", error);
    res.status(500).json({ ok: false, erro: error.message });
  }
};

// ============================================
// ADMIN: Listar alertas de discrepância
// ============================================
export const listarAlertasDiscrepancia = async (req, res) => {
  const { usuarioId, apenasAtivos } = req.query;

  try {
    const where = {
      discrepancia: { [Op.ne]: 0 }, // Apenas devoluções com discrepância
    };

    if (apenasAtivos === "true") {
      where.alertaAtivo = true;
    }

    if (usuarioId) {
      where.usuarioId = usuarioId;
    }

    const alertas = await db.DevolucaoCarrinho.findAll({
      where,
      include: [
        {
          model: db.CarrinhoUsuario,
          as: "carrinho",
          include: [
            {
              model: db.Usuario,
              as: "usuario",
              attributes: ["id", "nome", "email"],
            },
          ],
        },
        {
          model: db.Usuario,
          as: "usuario",
          attributes: ["id", "nome", "email"],
        },
      ],
      order: [["dataDevolucao", "DESC"]],
    });

    res.json({
      ok: true,
      alertas,
      total: alertas.length,
      ativos: alertas.filter((a) => a.alertaAtivo).length,
    });
  } catch (error) {
    console.error("Erro ao listar alertas:", error);
    res.status(500).json({ ok: false, erro: error.message });
  }
};

// ============================================
// ADMIN: Desativar alerta de discrepância
// ============================================
export const desativarAlerta = async (req, res) => {
  const { id } = req.params;
  const { observacao } = req.body;

  try {
    const devolucao = await db.DevolucaoCarrinho.findByPk(id);

    if (!devolucao) {
      return res.status(404).json({ ok: false, erro: "Devolução não encontrada" });
    }

    await devolucao.update({
      alertaAtivo: false,
      observacao: observacao || devolucao.observacao,
    });

    const devolucaoAtualizada = await db.DevolucaoCarrinho.findByPk(id, {
      include: [
        {
          model: db.CarrinhoUsuario,
          as: "carrinho",
          include: [
            {
              model: db.Usuario,
              as: "usuario",
              attributes: ["id", "nome", "email"],
            },
          ],
        },
        {
          model: db.Usuario,
          as: "usuario",
          attributes: ["id", "nome", "email"],
        },
      ],
    });

    res.json({
      ok: true,
      devolucao: devolucaoAtualizada,
      mensagem: "Alerta desativado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao desativar alerta:", error);
    res.status(500).json({ ok: false, erro: error.message });
  }
};

// ============================================
// ADMIN: Listar histórico completo de devoluções
// ============================================
export const listarHistoricoDevolucoes = async (req, res) => {
  const { dataInicio, dataFim, usuarioNome } = req.query;

  try {
    // Construir filtros dinamicamente
    const where = {};

    // Filtro por data
    if (dataInicio || dataFim) {
      where.dataDevolucao = {};
      
      if (dataInicio) {
        // Início do dia (00:00:00)
        const dataInicioDate = new Date(dataInicio + 'T00:00:00.000Z');
        where.dataDevolucao[Op.gte] = dataInicioDate;
      }
      
      if (dataFim) {
        // Fim do dia (23:59:59)
        const dataFimDate = new Date(dataFim + 'T23:59:59.999Z');
        where.dataDevolucao[Op.lte] = dataFimDate;
      }
    }

    // Construir include com filtro de nome se fornecido
    const includeUsuario = {
      model: db.Usuario,
      as: "usuario",
      attributes: ["id", "nome", "email"],
    };

    // Se houver filtro por nome, adicionar where no include
    if (usuarioNome && usuarioNome.trim()) {
      includeUsuario.where = {
        nome: {
          [Op.iLike]: `%${usuarioNome.trim()}%`,
        },
      };
    }

    // Buscar devoluções com todos os relacionamentos
    const devolucoes = await db.DevolucaoCarrinho.findAll({
      where,
      include: [
        includeUsuario,
        {
          model: db.CarrinhoUsuario,
          as: "carrinho",
          attributes: ["id", "data", "quantidadeInicial", "observacao"],
        },
        {
          model: db.DevolucaoCarrinhoItem,
          as: "itens",
          include: [
            {
              model: db.Produto,
              as: "produto",
              attributes: ["id", "nome", "codigo"],
            },
          ],
        },
      ],
      order: [["dataDevolucao", "DESC"]],
    });

    res.json(devolucoes);
  } catch (error) {
    console.error("Erro ao listar histórico de devoluções:", error);
    res.status(500).json({ 
      ok: false, 
      erro: "Erro ao buscar histórico de devoluções",
      detalhes: error.message 
    });
  }
};

// ============================================
// USUARIO: Status do carrinho (para dashboard)
// ============================================
export const getStatusCarrinho = async (req, res) => {
  const usuarioId = req.usuario?.id || req.params.usuarioId;

  if (!usuarioId) {
    return res.status(400).json({ ok: false, erro: "usuarioId não fornecido" });
  }

  try {
    const hoje = hojeBrasil();

    const carrinho = await db.CarrinhoUsuario.findOne({
      where: {
        usuarioId,
        data: hoje,
        ativo: true,
      },
    });

    if (!carrinho) {
      return res.json({
        ok: true,
        temCarrinho: false,
        mensagem: "Nenhum carrinho ativo para hoje",
      });
    }

    const percentualUsado =
      carrinho.quantidadeInicial > 0
        ? ((carrinho.quantidadeInicial - carrinho.quantidadeAtual) /
            carrinho.quantidadeInicial) *
          100
        : 0;

    res.json({
      ok: true,
      temCarrinho: true,
      carrinho: {
        id: carrinho.id,
        quantidadeInicial: carrinho.quantidadeInicial,
        quantidadeAtual: carrinho.quantidadeAtual,
        quantidadeUsada: carrinho.quantidadeInicial - carrinho.quantidadeAtual,
        percentualUsado: Math.round(percentualUsado),
        data: carrinho.data,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar status do carrinho:", error);
    res.status(500).json({ ok: false, erro: error.message });
  }
};
