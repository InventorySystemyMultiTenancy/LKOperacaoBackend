import { DataTypes } from "sequelize";
import { sequelize } from "../database/connection.js";

const RoteiroGasto = sequelize.define(
  "RoteiroGasto",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    roteiroId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "roteiro_id",
      references: {
        model: "roteiros",
        key: "id",
      },
    },
    categoria: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Combustível, Alimentação, Pedágio, etc",
    },
    valor: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    descricao: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
      kmAbastecimento: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "km_abastecimento",
        comment: "Quilometragem do abastecimento (obrigatório se categoria for Combustível)",
      },
      litrosAbastecimento: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: "litros_abastecimento",
        comment: "Litros abastecidos (obrigatório se categoria for Combustível)",
      },
  },
  {
    tableName: "roteiros_gastos",
    timestamps: true,
  }
);

export default RoteiroGasto;
