import { DataTypes } from "sequelize";
import { sequelize } from "../database/connection.js";

const Manutencao = sequelize.define(
  "Manutencao",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    maquinaId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "maquina_id",
      references: {
        model: "maquinas",
        key: "id",
      },
    },
    lojaId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "loja_id",
      references: {
        model: "lojas",
        key: "id",
      },
    },
    descricao: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    funcionarioId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "funcionario_id",
      references: { model: "usuarios", key: "id" },
    },
      roteiroId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "roteiro_id",
        references: {
          model: "roteiros",
          key: "id",
        },
      },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "pendente",
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "created_at",
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "updated_at",
    },
  },
  {
    tableName: "manutencoes",
    timestamps: true,
  }
);

export default Manutencao;
