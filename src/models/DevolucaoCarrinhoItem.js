import { DataTypes } from "sequelize";
import { sequelize } from "../database/connection.js";

/**
 * Modelo para itens individuais da devolução de carrinho
 * Registra a devolução de cada produto separadamente
 */
const DevolucaoCarrinhoItem = sequelize.define(
  "DevolucaoCarrinhoItem",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    devolucaoId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "devolucao_id",
      references: {
        model: "devolucoes_carrinho",
        key: "id",
      },
      comment: "ID da devolução",
    },
    produtoId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "produto_id",
      references: {
        model: "produtos",
        key: "id",
      },
      comment: "ID do produto",
    },
    quantidadeDevolvida: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "quantidade_devolvida",
      comment: "Quantidade deste produto que foi devolvida",
    },
    quantidadeEsperada: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "quantidade_esperada",
      comment: "Quantidade que deveria ter sobrado deste produto",
    },
    discrepancia: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "Diferença entre devolvida e esperada (devolvida - esperada)",
    },
  },
  {
    tableName: "devolucao_carrinho_itens",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ["devolucao_id"],
      },
      {
        fields: ["produto_id"],
      },
      {
        unique: true,
        fields: ["devolucao_id", "produto_id"],
        name: "unique_devolucao_produto",
      },
    ],
  }
);

export default DevolucaoCarrinhoItem;
