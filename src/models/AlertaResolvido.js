import { DataTypes } from "sequelize";
import { sequelize } from "../database/connection.js";

// Marca alertas (financeiros, de estoque, de inconsistência etc.) como
// resolvidos permanentemente. Os alertas em si não são registros no banco —
// são calculados a cada requisição a partir de outras tabelas — então esta
// tabela guarda apenas o identificador determinístico de cada alerta já
// tratado, para ser filtrado nas próximas gerações.
const AlertaResolvido = sequelize.define(
  "AlertaResolvido",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    alertaId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      field: "alerta_id",
      comment: "Identificador determinístico do alerta (ex: financeiro:<movimentacaoId>)",
    },
    categoria: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: "Ex: financeiro, estoque-maquina, estoque-deposito, inconsistencia",
    },
    usuarioId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "usuario_id",
    },
  },
  {
    tableName: "alertas_resolvidos",
    timestamps: true,
  }
);

export default AlertaResolvido;
