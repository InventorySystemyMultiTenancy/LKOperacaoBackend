import { sequelize } from "../connection.js";
import { DataTypes } from "sequelize";

/**
 * Migration: Adiciona campos de integração Machine Pay (Cyberpix) na tabela maquinas
 */
export const up = async () => {
  const queryInterface = sequelize.getQueryInterface();

  console.log(
    "Adicionando colunas machine_pay_pos_id e machine_pay_usr_id na tabela maquinas...",
  );

  await queryInterface.addColumn("maquinas", "machine_pay_pos_id", {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true,
    comment: "ID do POS (leitor PIX/cartão) cadastrado no painel Machine Pay",
  });

  await queryInterface.addColumn("maquinas", "machine_pay_usr_id", {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: "ID da conta/cliente dona do posId no painel Machine Pay",
  });

  console.log("✅ Migration concluída com sucesso!");
};

export const down = async () => {
  const queryInterface = sequelize.getQueryInterface();

  console.log(
    "Removendo colunas machine_pay_pos_id e machine_pay_usr_id da tabela maquinas...",
  );
  await queryInterface.removeColumn("maquinas", "machine_pay_pos_id");
  await queryInterface.removeColumn("maquinas", "machine_pay_usr_id");

  console.log("✅ Rollback concluído!");
};
