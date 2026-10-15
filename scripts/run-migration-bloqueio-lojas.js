import { sequelize } from "./database/connection.js";
import { QueryInterface } from "sequelize";

// Importar a migration
import migration from "./database/migrations/20260310-add-controle-movimentacao-lojas.js";

async function runMigration() {
  try {
    console.log("🔄 Executando migration: add-controle-movimentacao-lojas...");
    
    const queryInterface = sequelize.getQueryInterface();
    
    // Executar a migration
    await migration.up(queryInterface, sequelize.constructor);
    
    console.log("✅ Migration executada com sucesso!");
    console.log("📊 Campos adicionados:");
    console.log("   - movimentacao_em_andamento (BOOLEAN)");
    console.log("   - usuario_em_movimentacao_id (UUID)");
    console.log("   - data_inicio_movimentacao (DATE)");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao executar migration:", error);
    process.exit(1);
  }
}

runMigration();
