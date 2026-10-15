// backendclubkids/src/utils/resetSemanalRoteiros.js
import * as db from "../models/index.js";

/**
 * Reseta status de roteiros, lojas e máquinas semanalmente.
 * - Roteiros: status → 'pendente', dataConclusao → null
 * - Lojas: status → 'pendente', dataConclusao → null
 * - Máquinas: status → 'pendente'
 * - NÃO apaga movimentações
 */
export async function resetSemanalRoteiros() {
  const t = await db.sequelize.transaction();
  try {
    // 1. Resetar roteiros (exceto criação de novos)
    await db.Roteiro.update(
      { 
        status: "pendente", 
        maquinasConcluidas: 0, 
        semanaInicio: new Date(),
        saldoRestante: 500.0  // Reset do orçamento semanal
      },
      { where: {}, transaction: t },
    );

    // 2. Resetar lojas dos roteiros
    await db.Loja.update(
      { status: "pendente", dataConclusao: null },
      { where: {}, transaction: t },
    );

    // 3. Resetar máquinas
    await db.Maquina.update(
      { status: "pendente" },
      { where: {}, transaction: t },
    );

    // 4. Resetar conclusão das lojas nos roteiros (tabela roteiros_lojas)
    await db.sequelize.query("UPDATE roteiros_lojas SET concluida = false", {
      transaction: t,
    });

    // 5. Resetar status do roteiro 'Gruas Gigantes' (data fixa)
    await db.Roteiro.update(
      { status: "pendente" },
      { where: { zona: 'Gruas Gigantes', data: '2026-02-24' }, transaction: t },
    );

    await t.commit();
    console.log("Reset semanal realizado com sucesso (roteiro 'Gruas Gigantes' mantido e atualizado).");
  } catch (err) {
    await t.rollback();
    console.error("Erro no reset semanal:", err);
    throw err;
  }
}
