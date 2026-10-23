import { DataTypes } from "sequelize";
import { sequelize } from "../database/connection.js";

// Onde as pelúcias são compradas (para comprar de novo do mesmo lugar).
const Fornecedor = sequelize.define(
  "Fornecedor",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    nome: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    telefone: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    observacao: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "fornecedores",
    timestamps: true,
  },
);

export default Fornecedor;
