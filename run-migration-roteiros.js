import { sequelize } from "./src/database/connection.js";
import { addRoteirosTables } from "./src/database/migrations/add-roteiros-tables.js";

console.log("🚀 Iniciando migration de roteiros...");

try {
  // Testar conexão
  await sequelize.authenticate();
  console.log("✅ Conexão com banco de dados estabelecida");

  // Executar migration
  await addRoteirosTables();

  console.log("✅ Migration concluída com sucesso!");
  console.log("\n📋 Próximos passos:");
  console.log("1. Verifique se as tabelas foram criadas corretamente");
  console.log("2. Atualize os dados de zona nas lojas existentes");
  console.log("3. Use POST /api/roteiros/gerar para criar os primeiros roteiros");
  console.log("\n📖 Consulte ROTEIROS_MIGRATION_GUIDE.md para mais informações");

  process.exit(0);
} catch (error) {
  console.error("❌ Erro ao executar migration:", error);
  process.exit(1);
}
