import { DataTypes } from "sequelize";
import { sequelize } from "../database/connection.js";

// Histórico do estoque da base (produtos comprados ainda sem ponto).
// O saldo fica em produtos.estoqueAtual.
const MovimentacaoEstoqueBase = sequelize.define(
  "MovimentacaoEstoqueBase",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    produtoId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "produto_id",
    },
    tipo: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: "compra (entrou na base), envio_loja (saiu para um ponto), ajuste",
    },
    quantidade: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Positivo entra na base, negativo sai",
    },
    lojaId: { type: DataTypes.UUID, allowNull: true, field: "loja_id" },
    compraId: { type: DataTypes.UUID, allowNull: true, field: "compra_id" },
    usuarioId: { type: DataTypes.UUID, allowNull: true, field: "usuario_id" },
    observacao: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: "movimentacoes_estoque_base",
    timestamps: true,
  },
);

export default MovimentacaoEstoqueBase;
