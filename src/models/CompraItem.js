import { DataTypes } from "sequelize";
import { sequelize } from "../database/connection.js";

const CompraItem = sequelize.define(
  "CompraItem",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    compraId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "compra_id",
    },
    produtoId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "produto_id",
    },
    quantidade: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 },
    },
    custoUnitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: "custo_unitario",
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    lojaId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "loja_id",
      comment: "Ponto que recebeu na compra; null = estoque da base",
    },
  },
  {
    tableName: "compras_itens",
    timestamps: true,
  },
);

export default CompraItem;
