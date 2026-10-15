import { up, down } from "./src/database/migrations/20260713-add-machine-pay-maquinas.js";

const reverter = process.argv.includes("--down");

console.log(
  reverter
    ? "🚀 Revertendo migration de integração Machine Pay...\n"
    : "🚀 Executando migration de integração Machine Pay...\n",
);

try {
  if (reverter) {
    await down();
  } else {
    await up();
    console.log(
      "\nCampos adicionados na tabela maquinas: machine_pay_pos_id, machine_pay_usr_id",
    );
    console.log(
      "Para reverter, execute: node run-migration-machine-pay.js --down",
    );
  }
  console.log("\n✅ Concluído com sucesso!");
  process.exit(0);
} catch (error) {
  console.error("\n❌ Erro ao executar migration:", error);
  process.exit(1);
}
