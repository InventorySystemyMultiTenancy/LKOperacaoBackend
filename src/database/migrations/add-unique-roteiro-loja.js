import { sequelize } from "../connection.js";

/**
 * Migration para adicionar constraint UNIQUE em (roteiro_id, loja_id)
 * na tabela roteiros_lojas, impedindo que a mesma loja seja adicionada
 * mais de uma vez ao mesmo roteiro (inclusive via race condition).
 */
export const addUniqueRoteiroLoja = async () => {
  try {
    console.log("Adicionando constraint UNIQUE (roteiro_id, loja_id) em roteiros_lojas...");
    await sequelize.query(`
      ALTER TABLE roteiros_lojas
      ADD CONSTRAINT unique_roteiro_loja UNIQUE (roteiro_id, loja_id);
    `);
    console.log("✅ Constraint adicionada com sucesso!");
  } catch (error) {
    if (error.message && (error.message.includes("already exists") || error.message.includes("duplicate"))) {
      console.log("ℹ️  Constraint unique_roteiro_loja já existe, pulando...");
    } else {
      console.error("Erro ao adicionar constraint:", error);
      throw error;
    }
  }
};
