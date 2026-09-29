// Migration para adicionar controle de movimentação em andamento na tabela lojas

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("lojas", "movimentacao_em_andamento", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "Indica se há uma movimentação em andamento nesta loja"
    });

    await queryInterface.addColumn("lojas", "usuario_em_movimentacao_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: "usuarios",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
      comment: "ID do usuário que está fazendo movimentação nesta loja"
    });

    await queryInterface.addColumn("lojas", "data_inicio_movimentacao", {
      type: Sequelize.DATE,
      allowNull: true,
      comment: "Data/hora em que a movimentação foi iniciada"
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("lojas", "movimentacao_em_andamento");
    await queryInterface.removeColumn("lojas", "usuario_em_movimentacao_id");
    await queryInterface.removeColumn("lojas", "data_inicio_movimentacao");
  }
};
