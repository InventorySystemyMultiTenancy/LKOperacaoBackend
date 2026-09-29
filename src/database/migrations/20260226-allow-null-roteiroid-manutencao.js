import { sequelize } from "../connection.js";

export const up = async () => {
  const queryInterface = sequelize.getQueryInterface();
  // Altera a coluna roteiro_id em manutencoes para aceitar null
  await queryInterface.changeColumn("manutencoes", "roteiro_id", {
    type: sequelize.Sequelize.UUID,
    allowNull: true,
    references: {
      model: "roteiros",
      key: "id",
    },
    onDelete: "SET NULL",
  });
};

export const down = async () => {
  const queryInterface = sequelize.getQueryInterface();
  // Reverte para NOT NULL
  await queryInterface.changeColumn("manutencoes", "roteiro_id", {
    type: sequelize.Sequelize.UUID,
    allowNull: false,
    references: {
      model: "roteiros",
      key: "id",
    },
    onDelete: "CASCADE",
  });
};
