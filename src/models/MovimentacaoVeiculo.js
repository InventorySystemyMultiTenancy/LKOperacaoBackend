import { DataTypes } from "sequelize";
import { sequelize } from "../database/connection.js";

const MovimentacaoVeiculo = sequelize.define(
  "MovimentacaoVeiculo",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    veiculoId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "veiculoid"
    },
    usuarioId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "usuarioid"
    },
    tipo: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "tipo"
    },
    km: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "km"
    },
    dataMovimentacao: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "datahora"
    },
    gasolina: {
      type: DataTypes.STRING(30),
      allowNull: true,
      field: "gasolina"
    },
    nivel_limpeza: {
      type: DataTypes.STRING(30),
      allowNull: true,
      field: "nivel_limpeza"
    },
    estado: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    modo: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    obs: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    litrosAbastecidos: {
      type: DataTypes.DECIMAL(6,2),
      allowNull: true,
      defaultValue: null,
      comment: "Quantidade de litros abastecidos na movimentação",
    },
    postoAbastecimento: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null,
      comment: "Nome do posto de abastecimento na movimentação",
    },
  },
  {
    tableName: "movimentacoes_veiculos",
    timestamps: false,
  },
);

export default MovimentacaoVeiculo;
