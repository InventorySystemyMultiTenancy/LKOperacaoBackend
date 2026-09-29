import { sequelize } from "../connection.js";

export const addObservacoesRoteiros = async () => {
  const queryInterface = sequelize.getQueryInterface();
  try {
    console.log("Adicionando coluna observacoes na tabela roteiros...");
    await queryInterface.addColumn("roteiros", "observacoes", {
      type: sequelize.Sequelize.TEXT,
      allowNull: true,
      defaultValue: null,
    });
    console.log("✅ Coluna observacoes adicionada com sucesso!");
  } catch (error) {
    if (error.message && error.message.includes("already exists")) {
      console.log("ℹ️  Coluna observacoes já existe, pulando...");
    } else {
      console.error("Erro ao adicionar coluna observacoes:", error);
      throw error;
    }
  }
};
