import { DataTypes } from "sequelize";
import { sequelize } from "../database/connection.js";

const Loja = sequelize.define(
  "Loja",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    nome: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    endereco: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    cidade: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    estado: {
      type: DataTypes.STRING(2),
      allowNull: true,
    },
    zona: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Norte, Sul, Leste, Oeste, Centro",
    },
    responsavel: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    telefone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    percentualComissao: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      field: "percentual_comissao",
      comment: "Comissão do ponto (%) sobre o valor bruto do Controle de Arrecadação",
      validate: { min: 0, max: 100 },
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    movimentacaoEmAndamento: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "movimentacao_em_andamento",
      comment: "Indica se há uma movimentação em andamento nesta loja",
    },
    usuarioEmMovimentacaoId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "usuario_em_movimentacao_id",
      comment: "ID do usuário que está fazendo movimentação nesta loja",
    },
    dataInicioMovimentacao: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "data_inicio_movimentacao",
      comment: "Data/hora em que a movimentação foi iniciada",
    },
  },
  {
    tableName: "lojas",
    timestamps: true,
  }
);

export default Loja;
