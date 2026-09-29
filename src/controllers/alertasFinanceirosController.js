import { gerarAlertasFinanceiros } from "../utils/alertasFinanceiros.js";

const alertasFinanceirosController = {
  async listarAlertas(req, res) {
    try {
      const alertas = await gerarAlertasFinanceiros();
      res.json(alertas);
    } catch (err) {
      res.status(500).json({
        error: "Erro ao buscar alertas financeiros",
        details: err.message,
      });
    }
  },
};

export default alertasFinanceirosController;
