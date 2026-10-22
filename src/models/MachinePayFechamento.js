import { DataTypes } from "sequelize";
import { sequelize } from "../database/connection.js";

// Fechamento de vendas de um leitor Machine Pay num período: o que foi
// fechado no painel (Cyberpix) e o relatório enviado ao ponto.
const MachinePayFechamento = sequelize.define(
  "MachinePayFechamento",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    posId: { type: DataTypes.STRING(50), allowNull: false, field: "pos_id" },
    nomePonto: { type: DataTypes.STRING(255), allowNull: true, field: "nome_ponto" },
    dataInicio: { type: DataTypes.DATEONLY, allowNull: false, field: "data_inicio" },
    dataFim: { type: DataTypes.DATEONLY, allowNull: false, field: "data_fim" },
    quantidadeVendas: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: "quantidade_vendas" },
    porMetodo: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      field: "por_metodo",
      comment: "[{ metodo, quantidade, total }]",
    },
    totalVendas: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0, field: "total_vendas" },
    percentualComissao: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0, field: "percentual_comissao" },
    totalComissao: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0, field: "total_comissao" },
    totalLiquido: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0, field: "total_liquido" },
    dinheiroEspecie: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0, field: "dinheiro_especie" },
    whatsapp: { type: DataTypes.STRING(20), allowNull: true },
    usuarioId: { type: DataTypes.UUID, allowNull: true, field: "usuario_id" },
    usuarioNome: { type: DataTypes.STRING(100), allowNull: true, field: "usuario_nome" },
    fechadoNoPainel: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "fechado_no_painel" },
    erroPainel: { type: DataTypes.TEXT, allowNull: true, field: "erro_painel" },
  },
  {
    tableName: "machine_pay_fechamentos",
    timestamps: true,
  },
);

export default MachinePayFechamento;
