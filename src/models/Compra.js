import { DataTypes } from "sequelize";
import { sequelize } from "../database/connection.js";

// Compra de produtos (pelúcias) de um fornecedor. Cada item vai para o
// estoque de um ponto (lojaId) ou fica no estoque da base (lojaId null).
const Compra = sequelize.define(
  "Compra",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    data: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    fornecedorId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "fornecedor_id",
    },
    fornecedorNome: {
      type: DataTypes.STRING(120),
      allowNull: true,
      field: "fornecedor_nome",
    },
    usuarioId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "usuario_id",
    },
    usuarioNome: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "usuario_nome",
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    observacao: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "compras",
    timestamps: true,
  },
);

export default Compra;
