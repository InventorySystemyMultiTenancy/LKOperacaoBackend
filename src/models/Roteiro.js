
import { DataTypes } from "sequelize";
import { sequelize } from "../database/connection.js";

const Roteiro = sequelize.define(
  "Roteiro",
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
    zona: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Norte, Sul, Leste, Oeste, Centro",
    },
    estado: {
      type: DataTypes.STRING(2),
      allowNull: true,
    },
    cidade: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "pendente",
      comment: "pendente, em_andamento, concluido",
    },
    funcionarioId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "usuarios",
        key: "id",
      },
    },
    funcionarioNome: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    totalMaquinas: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    maquinasConcluidas: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    saldoRestante: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 500.0,
    },
    semanaInicio: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
      field: "semana_inicio",
      comment: "Timestamp do último reset semanal; usado para filtrar movimentações ao calcular 'atendida'",
    },
    observacoes: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: "roteiros",
    timestamps: true,
  }
);

export default Roteiro;
