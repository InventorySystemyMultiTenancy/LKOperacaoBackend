import { sequelize } from "../connection.js";

/**
 * Migration para adicionar coluna semana_inicio na tabela roteiros.
 * Usada para rastrear quando o roteiro foi resetado semanalmente,
 * permitindo que o campo 'atendida' das máquinas seja calculado
 * apenas com movimentações registradas após o último reset.
 */
export const addSemanaInicioRoteiros = async () => {
  const queryInterface = sequelize.getQueryInterface();

  try {
    console.log("Adicionando coluna semana_inicio na tabela roteiros...");
    await queryInterface.addColumn("roteiros", "semana_inicio", {
      type: sequelize.Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });
    console.log("✅ Coluna semana_inicio adicionada com sucesso!");
  } catch (error) {
    if (error.message && error.message.includes("already exists")) {
      console.log("ℹ️  Coluna semana_inicio já existe, pulando...");
    } else {
      console.error("Erro ao adicionar coluna semana_inicio:", error);
      throw error;
    }
  }
};
