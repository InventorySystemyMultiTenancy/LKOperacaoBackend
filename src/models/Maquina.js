import { DataTypes } from "sequelize";
import { sequelize } from "../database/connection.js";

const Maquina = sequelize.define(
  "Maquina",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    codigo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: "Ex: M01, M02, TK BALL",
    },
    nome: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    tipo: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Ex: Grua, TakeBall",
    },
    lojaId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "lojas",
        key: "id",
      },
    },
    capacidadePadrao: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
      comment: "Quantidade máxima que a máquina comporta",
    },
    valorFicha: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 5.0,
      comment: "Valor em R$ de cada ficha",
    },
    fichasNecessarias: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "fichas_necessarias",
      comment: "Quantidade de fichas necessárias para liberar uma jogada",
      validate: {
        min: 1,
      },
    },
    forcaForte: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "forca_forte",
      comment: "Força forte da garra em percentual (0-100%)",
      validate: {
        min: 0,
        max: 100,
      },
    },
    forcaFraca: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "forca_fraca",
      comment: "Força fraca da garra em percentual (0-100%)",
      validate: {
        min: 0,
        max: 100,
      },
    },
    forcaPremium: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "forca_premium",
      comment: "Força premium da garra em percentual (0-100%)",
      validate: {
        min: 0,
        max: 100,
      },
    },
    jogadasPremium: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "jogadas_premium",
      comment: "Quantidade de jogadas para usar a força premium",
      validate: {
        min: 1,
      },
    },
    valorPulso: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 1.0,
      field: "valor_pulso",
      comment: "Quanto vale cada pulso do contador IN (R$). Padrão: 1 pulso = R$ 1,00",
    },
    valorJogada: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: "valor_jogada",
      comment: "Preço de uma jogada (R$). Ex: 2,00",
    },
    jogadasPorPremio: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "jogadas_por_premio",
      comment: "Configuração de pagamento: 1 prêmio a cada N jogadas. Ex: 15",
      validate: { min: 1 },
    },
    percentualAlertaEstoque: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30,
      comment: "Porcentagem mínima para alertar estoque baixo",
    },
    percentualComissao: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0,
      field: "percentual_comissao",
      comment: "Percentual de comissão sobre o lucro da máquina (0-100%)",
      validate: {
        min: 0,
        max: 100,
      },
    },
    localizacao: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Posição dentro da loja",
    },
    machinePayPosId: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
      field: "machine_pay_pos_id",
      comment: "ID do POS (leitor PIX/cartão) cadastrado no painel Machine Pay",
    },
    machinePayUsrId: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "machine_pay_usr_id",
      comment: "ID da conta/cliente dona do posId no painel Machine Pay",
    },
    regiao: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "CAPITAL",
      validate: { isIn: [["CAPITAL", "INTERIOR"]] },
      comment: "CAPITAL ou INTERIOR",
    },
    horarioFuncionamento: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: "horario_funcionamento",
      comment:
        "Dias/horários em que o ponto fica aberto ({ '0'..'6': { inicio, fim } }). null = 24h",
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "maquinas",
    timestamps: true,
  }
);

export default Maquina;
