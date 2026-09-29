/**
 * Migration: Adicionar tabelas de carrinho de produtos por usuário
 * 
 * Descrição:
 * - Tabela carrinho_usuarios: Armazena quantidade total de produtos que cada usuário leva por dia
 * - Tabela devolucoes_carrinho: Registra devoluções e inconsistências
 * 
 * Data: 2026-03-10
 */

export const up = async (queryInterface, Sequelize) => {
  const transaction = await queryInterface.sequelize.transaction();

  try {
    // 1. Criar tabela carrinho_usuarios
    await queryInterface.createTable(
      "carrinho_usuarios",
      {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        usuario_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: "usuarios",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        quantidade_inicial: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
          comment: "Quantidade total de produtos que o usuário levou no início do dia",
        },
        quantidade_atual: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
          comment: "Quantidade atual no carrinho (vai diminuindo com as movimentações)",
        },
        data: {
          type: Sequelize.DATEONLY,
          allowNull: false,
          defaultValue: Sequelize.NOW,
          comment: "Data do carrinho",
        },
        ativo: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment: "Se o carrinho ainda está ativo",
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
      },
      { transaction }
    );

    // Índices para carrinho_usuarios
    await queryInterface.addIndex("carrinho_usuarios", ["usuario_id"], {
      name: "idx_carrinho_usuarios_usuario_id",
      transaction,
    });

    await queryInterface.addIndex("carrinho_usuarios", ["data"], {
      name: "idx_carrinho_usuarios_data",
      transaction,
    });

    await queryInterface.addIndex("carrinho_usuarios", ["ativo"], {
      name: "idx_carrinho_usuarios_ativo",
      transaction,
    });

    // Constraint única para usuario_id + data
    await queryInterface.addConstraint("carrinho_usuarios", {
      fields: ["usuario_id", "data"],
      type: "unique",
      name: "unique_usuario_data",
      transaction,
    });

    // 2. Criar tabela devolucoes_carrinho
    await queryInterface.createTable(
      "devolucoes_carrinho",
      {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        carrinho_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: "carrinho_usuarios",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        usuario_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: "usuarios",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
          comment: "Usuário que está devolvendo os produtos",
        },
        quantidade_devolvida: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: "Quantidade informada pelo usuário que está devolvendo",
        },
        quantidade_esperada: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: "Quantidade que deveria sobrar no carrinho",
        },
        discrepancia: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
          comment: "Diferença entre devolvida e esperada",
        },
        alerta_ativo: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment: "Se o alerta de inconsistência está ativo",
        },
        observacao: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: "Observação sobre a devolução",
        },
        data_devolucao: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
      },
      { transaction }
    );

    // Índices para devolucoes_carrinho
    await queryInterface.addIndex("devolucoes_carrinho", ["carrinho_id"], {
      name: "idx_devolucoes_carrinho_carrinho_id",
      transaction,
    });

    await queryInterface.addIndex("devolucoes_carrinho", ["usuario_id"], {
      name: "idx_devolucoes_carrinho_usuario_id",
      transaction,
    });

    await queryInterface.addIndex("devolucoes_carrinho", ["alerta_ativo"], {
      name: "idx_devolucoes_carrinho_alerta_ativo",
      transaction,
    });

    await queryInterface.addIndex("devolucoes_carrinho", ["data_devolucao"], {
      name: "idx_devolucoes_carrinho_data_devolucao",
      transaction,
    });

    await transaction.commit();
    console.log("✅ Migration: Tabelas de carrinho criadas com sucesso!");
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Erro na migration de carrinho:", error);
    throw error;
  }
};

export const down = async (queryInterface, Sequelize) => {
  const transaction = await queryInterface.sequelize.transaction();

  try {
    await queryInterface.dropTable("devolucoes_carrinho", { transaction });
    await queryInterface.dropTable("carrinho_usuarios", { transaction });

    await transaction.commit();
    console.log("✅ Rollback: Tabelas de carrinho removidas com sucesso!");
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Erro no rollback da migration de carrinho:", error);
    throw error;
  }
};
