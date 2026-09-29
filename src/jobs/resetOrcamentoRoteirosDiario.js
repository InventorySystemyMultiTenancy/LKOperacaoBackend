// Reset diário do orçamento dos roteiros para R$ 500
import cron from "node-cron";
import Roteiro from "../models/Roteiro.js";

// Agendamento: todos os dias às 00:00
cron.schedule("0 0 * * *", async () => {
  try {
    console.log("🔁 Executando reset diário do orçamento dos roteiros...");
    
    // Atualizar todos os roteiros para ter saldoRestante = 500
    const [updated] = await Roteiro.update(
      { saldoRestante: 500.0 },
      { where: {} } // Sem where = todos os registros
    );
    
    console.log(`✅ Reset diário concluído! ${updated} roteiros atualizados com orçamento de R$ 500.`);
  } catch (error) {
    console.error("❌ Erro no reset diário do orçamento:", error);
  }
});

export default null; // Apenas para garantir importação