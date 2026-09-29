import { DataTypes } from "sequelize";
import { sequelize } from "../database/connection.js";

/**
 * Modelo para itens individuais do carrinho
 * Similar a MovimentacaoProduto, mas para carrinhos
 */
const CarrinhoItem = sequelize.define(
  "CarrinhoItem",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    carrinhoId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "carrinho_id",
      references: {
        model: "carrinho_usuarios",
        key: "id",
      },
      comment: "ID do carrinho",
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
    quantidadeInicial: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "quantidade_inicial",
      comment: "Quantidade inicial deste produto no carrinho",
    },
    quantidadeAtual: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "quantidade_atual",
      comment: "Quantidade atual deste produto (diminui com movimentações)",
    },
  },
  {
    tableName: "carrinho_itens",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ["carrinho_id"],
      },
      {
        fields: ["produto_id"],
      },
      {
        unique: true,
        fields: ["carrinho_id", "produto_id"],
        name: "unique_carrinho_produto",
      },
    ],
  }
);

export default CarrinhoItem;
