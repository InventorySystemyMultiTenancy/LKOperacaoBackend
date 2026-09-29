import { up, down } from "./src/database/migrations/add-comissao-maquinas-lojas.js";

console.log("🚀 Executando migration de comissões...\n");

try {
  await up();
  console.log("\n✅ Migration executada com sucesso!");
  console.log("\nO sistema de comissões está pronto para uso:");
  console.log("1. Campo 'percentual_comissao' adicionado na tabela maquinas");
  console.log("2. Tabela 'comissoes_lojas' criada");
  console.log("\nPróximos passos:");
  console.log("- Configure a porcentagem de comissão nas máquinas (MaquinaForm)");
  console.log("- Execute roteiros e finalize lojas para gerar comissões");
  console.log("- Acesse o Dashboard para visualizar relatórios de comissões");
  
  process.exit(0);
} catch (error) {
  console.error("\n❌ Erro ao executar migration:", error);
  console.error("\nPara reverter, execute: npm run migration:rollback:comissoes");
  process.exit(1);
}
