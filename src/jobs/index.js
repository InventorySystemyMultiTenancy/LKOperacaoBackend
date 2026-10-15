// Importa e executa o job de reset semanal
import "../jobs/resetSemanal.js";

// Importa e executa o job de reset diário do orçamento dos roteiros
import "../jobs/resetOrcamentoRoteirosDiario.js";

// Coleta periódica do status dos leitores Machine Pay
import "../jobs/machinePayMonitor.js";
