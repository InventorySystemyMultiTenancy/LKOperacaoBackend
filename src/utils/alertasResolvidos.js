import { AlertaResolvido } from "../models/index.js";

// Busca o conjunto de alertaIds já resolvidos para uma categoria, para
// filtrar na geração dos alertas (que são sempre recalculados na hora).
export async function buscarIdsResolvidos(categoria) {
  const registros = await AlertaResolvido.findAll({
    where: { categoria },
    attributes: ["alertaId"],
  });
  return new Set(registros.map((r) => r.alertaId));
}

export async function marcarAlertaResolvido({ alertaId, categoria, usuarioId }) {
  const [registro] = await AlertaResolvido.findOrCreate({
    where: { alertaId },
    defaults: { alertaId, categoria, usuarioId: usuarioId || null },
  });
  return registro;
}
