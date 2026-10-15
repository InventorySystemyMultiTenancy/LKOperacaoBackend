import cron from "node-cron";
import { executarReiniciosAgendados } from "../services/roteiroGestaoService.js";

// A cada 5 minutos: roteiros com regra própria de reinício (todo dia, dias da
// semana ou a cada N dias) voltam a "pendente" quando chega o horário.
cron.schedule("*/5 * * * *", async () => {
  try {
    await executarReiniciosAgendados();
  } catch (error) {
    console.error("[Roteiros] Falha no reinício agendado:", error.message);
  }
});

export default null;
