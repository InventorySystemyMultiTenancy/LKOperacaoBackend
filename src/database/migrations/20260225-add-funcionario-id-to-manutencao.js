// Migration para adicionar funcionario_id à tabela manutencoes

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("manutencoes", "funcionario_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: "usuarios",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("manutencoes", "funcionario_id");
  }
};
