import { DataTypes } from "sequelize";
import { sequelize } from "../database/connection.js";

const DevolucaoCarrinho = sequelize.define(
  "DevolucaoCarrinho",
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
    },
    usuarioId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "usuario_id",
      references: {
        model: "usuarios",
        key: "id",
      },
      comment: "Usuário que está devolvendo os produtos",
    },
    quantidadeDevolvida: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "quantidade_devolvida",
      comment: "Quantidade informada pelo usuário que está devolvendo",
    },
    quantidadeEsperada: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "quantidade_esperada",
      comment: "Quantidade que deveria sobrar no carrinho (quantidadeAtual do carrinho)",
    },
    discrepancia: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "Diferença entre devolvida e esperada (devolvida - esperada)",
    },
    alertaAtivo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "alerta_ativo",
      comment: "Se o alerta de inconsistência está ativo (pode ser desligado pelo admin)",
    },
    observacao: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Observação do usuário ou admin sobre a devolução",
    },
    dataDevolucao: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "data_devolucao",
    },
  },
  {
    tableName: "devolucoes_carrinho",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ["carrinho_id"],
      },
      {
        fields: ["usuario_id"],
      },
      {
        fields: ["alerta_ativo"],
      },
      {
        fields: ["data_devolucao"],
      },
    ],
  }
);

export default DevolucaoCarrinho;
