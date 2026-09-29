import {
  buscarIdsResolvidos,
  marcarAlertaResolvido,
} from "../utils/alertasResolvidos.js";

const alertasResolvidosController = {
  async listar(req, res) {
    try {
      const { categoria } = req.query;
      if (!categoria) {
        return res.status(400).json({ error: "categoria é obrigatória" });
      }
      const ids = await buscarIdsResolvidos(categoria);
      res.json({ alertaIds: Array.from(ids) });
    } catch (err) {
      res.status(500).json({
        error: "Erro ao listar alertas resolvidos",
        details: err.message,
      });
    }
  },

  async resolver(req, res) {
    try {
      const { alertaId, categoria } = req.body;
      if (!alertaId || !categoria) {
        return res
          .status(400)
          .json({ error: "alertaId e categoria são obrigatórios" });
      }
      await marcarAlertaResolvido({
        alertaId,
        categoria,
        usuarioId: req.usuario?.id,
      });
      res.json({ message: "Alerta marcado como resolvido" });
    } catch (err) {
      res.status(500).json({
        error: "Erro ao marcar alerta como resolvido",
        details: err.message,
      });
    }
  },
};

export default alertasResolvidosController;
