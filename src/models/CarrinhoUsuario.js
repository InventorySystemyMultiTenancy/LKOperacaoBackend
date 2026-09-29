import { DataTypes } from "sequelize";
import { sequelize } from "../database/connection.js";

const CarrinhoUsuario = sequelize.define(
  "CarrinhoUsuario",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    usuarioId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "usuario_id",
      references: {
        model: "usuarios",
        key: "id",
      },
    },
    quantidadeInicial: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "quantidade_inicial",
      comment: "Quantidade total de produtos que o usuário levou no início do dia",
    },
    quantidadeAtual: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "quantidade_atual",
      comment: "Quantidade atual no carrinho (vai diminuindo com as movimentações)",
    },
    data: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: "Data do carrinho",
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: "Se o carrinho ainda está ativo (pode ser desativado ao final do dia)",
    },
    observacao: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Observações sobre o carrinho (ex: pedido especial, cliente VIP, etc)",
    },
  },
  {
    tableName: "carrinho_usuarios",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ["usuario_id"],
      },
      {
        fields: ["data"],
      },
      {
        fields: ["ativo"],
      },
      {
        unique: true,
        fields: ["usuario_id", "data"],
        name: "unique_usuario_data",
      },
    ],
  }
);

export default CarrinhoUsuario;
