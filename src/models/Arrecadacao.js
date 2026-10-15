import { DataTypes } from "sequelize";
import { sequelize } from "../database/connection.js";

// Controle de Arrecadação: o "papel" que o funcionário preenche no ponto.
// Uma arrecadação junta uma ou mais máquinas da loja; cada máquina também
// vira uma movimentação (contadores, dinheiro e digital) para a conferência.
const Arrecadacao = sequelize.define(
  "Arrecadacao",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    lojaId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "loja_id",
      references: { model: "lojas", key: "id" },
    },
    roteiroId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "roteiro_id",
    },
    usuarioId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "usuario_id",
      references: { model: "usuarios", key: "id" },
    },
    responsavelNome: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "responsavel_nome",
    },
    data: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    itens: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      comment:
        "[{ maquinaId, maquinaNome, dinheiro, cartao, pix, moeda, fichas, caiu, contadorIn, contadorOut, total, movimentacaoId }]",
    },
    totais: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      comment: "Soma das máquinas: { dinheiro, cartao, pix, moeda, fichas, caiu }",
    },
    valorBruto: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: "valor_bruto",
    },
    percentualComissao: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      field: "percentual_comissao",
    },
    valorComissao: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: "valor_comissao",
    },
    valorLiquido: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: "valor_liquido",
    },
    observacao: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Via do cliente: quem conferiu no ponto
    recebedorNome: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "recebedor_nome",
    },
    recebedorWhatsapp: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "recebedor_whatsapp",
    },
    recebedorVisto: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "recebedor_visto",
      comment: "Assinatura (visto) desenhada na tela, PNG em data URL",
    },
  },
  {
    tableName: "arrecadacoes",
    timestamps: true,
  },
);

export default Arrecadacao;
