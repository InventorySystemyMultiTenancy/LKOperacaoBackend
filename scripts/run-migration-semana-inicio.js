import { sequelize } from "./src/database/connection.js";
import { addSemanaInicioRoteiros } from "./src/database/migrations/add-semana-inicio-roteiros.js";

console.log("🚀 Iniciando migration: adicionar semana_inicio em roteiros...");

try {
  await sequelize.authenticate();
  console.log("✅ Conexão com banco de dados estabelecida");

  await addSemanaInicioRoteiros();

  console.log("✅ Migration concluída com sucesso!");
  console.log("\n📋 O que foi feito:");
  console.log("   - Adicionada coluna semana_inicio (TIMESTAMP, nullable) na tabela roteiros");
  console.log("\n📋 Próximos passos:");
  console.log("   - O reset semanal agora irá preencher semana_inicio com a data/hora do reset");
  console.log("   - O campo 'atendida' das máquinas só considerará movimentações após semana_inicio");
  console.log("   - Para forçar o reset agora em todos os roteiros existentes, execute a query:");
  console.log("     UPDATE roteiros SET semana_inicio = NOW() WHERE semana_inicio IS NULL;");

  process.exit(0);
} catch (error) {
  console.error("❌ Erro ao executar migration:", error);
  process.exit(1);
}
