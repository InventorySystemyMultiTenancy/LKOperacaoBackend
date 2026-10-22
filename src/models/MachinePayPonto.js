import { DataTypes } from "sequelize";
import { sequelize } from "../database/connection.js";

// Dados do ponto de cada leitor Machine Pay, usados no relatório de vendas:
// para quem enviar (WhatsApp) e quanto o ponto recebe de comissão.
const MachinePayPonto = sequelize.define(
  "MachinePayPonto",
  {
    posId: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      field: "pos_id",
    },
    nomeContato: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "nome_contato",
    },
    whatsapp: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    percentualComissao: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      field: "percentual_comissao",
      validate: { min: 0, max: 100 },
    },
  },
  {
    tableName: "machine_pay_pontos",
    timestamps: true,
  },
);

export default MachinePayPonto;
