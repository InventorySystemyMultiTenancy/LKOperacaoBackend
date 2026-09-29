// Listar todas as movimentações de um veículo, ordenadas da mais recente para a mais antiga
export const listarMovimentacoesPorVeiculo = async (req, res) => {
  try {
    const { veiculoId } = req.params;
    if (!veiculoId) {
      return res.status(400).json({ error: 'veiculoId é obrigatório na URL.' });
    }
    const movimentacoes = await MovimentacaoVeiculo.findAll({
      where: { veiculoId },
      order: [['dataMovimentacao', 'DESC']],
      attributes: [
        'id',
        'veiculoId',
        'tipo',
        'dataMovimentacao',
        'estado',
        'nivel_limpeza',
        'gasolina',
        'modo',
        'obs',
        'km',
        'litrosAbastecidos',
        'postoAbastecimento',
      ],
    });
    res.json(movimentacoes);
  } catch (error) {
    console.error('Erro ao listar movimentações do veículo:', error);
    res.status(500).json({ error: 'Erro ao listar movimentações do veículo' });
  }
};
import MovimentacaoVeiculo from "../models/MovimentacaoVeiculo.js";
import Veiculo from "../models/Veiculo.js";
import Usuario from "../models/Usuario.js";
import { sequelize } from "../database/connection.js";
import { Op, Sequelize } from "sequelize";
import { randomUUID } from "node:crypto";

const TABELAS_MOVIMENTACAO_VEICULO = [
  "movimentacoes_veiculos",
  "movimentacao_veiculos",
];

const quoteIdent = (identifier) => `"${String(identifier).replace(/"/g, '""')}"`;

const localizarTabelaMovimentacaoVeiculo = async () => {
  const queryInterface = sequelize.getQueryInterface();

  for (const tableName of TABELAS_MOVIMENTACAO_VEICULO) {
    try {
      const description = await queryInterface.describeTable(tableName);
      return {
        tableName,
        columns: Object.keys(description),
      };
    } catch (error) {
      // Continua procurando na próxima tabela candidata.
    }
  }

  return null;
};

const encontrarColuna = (columns, candidates) =>
  candidates.find((candidate) => columns.includes(candidate));

const normalizarRetornoMovimentacao = (row) => ({
  id: row.id,
  veiculoId: row.veiculoId ?? row.veiculoid ?? row.veiculo_id,
  usuarioId: row.usuarioId ?? row.usuarioid ?? row.usuario_id,
  tipo: row.tipo,
  km: row.km,
  dataMovimentacao: row.dataMovimentacao ?? row.datahora ?? row.data_movimentacao,
  gasolina: row.gasolina ?? null,
  nivel_limpeza: row.nivel_limpeza ?? row.nivelLimpeza ?? null,
  estado: row.estado ?? null,
  modo: row.modo ?? null,
  obs: row.obs ?? null,
  litrosAbastecidos: row.litrosAbastecidos ?? row.litros_abastecidos ?? 0,
  postoAbastecimento: row.postoAbastecimento ?? row.posto_abastecimento ?? "",
});

const inserirMovimentacaoNoSchemaLegado = async (dados) => {
  const tabelaEncontrada = await localizarTabelaMovimentacaoVeiculo();

  if (!tabelaEncontrada) {
    throw new Error(
      "Tabela de movimentação de veículo não encontrada (movimentacoes_veiculos/movimentacao_veiculos).",
    );
  }

  const { tableName, columns } = tabelaEncontrada;
  const idCol = encontrarColuna(columns, ["id"]);
  const veiculoCol = encontrarColuna(columns, ["veiculoId", "veiculoid", "veiculo_id"]);
  const usuarioCol = encontrarColuna(columns, ["usuarioId", "usuarioid", "usuario_id"]);
  const tipoCol = encontrarColuna(columns, ["tipo"]);
  const kmCol = encontrarColuna(columns, ["km"]);
  const dataCol = encontrarColuna(columns, ["dataMovimentacao", "datahora", "data_movimentacao"]);

  if (!veiculoCol || !usuarioCol || !tipoCol || !kmCol || !dataCol) {
    throw new Error(
      "Schema da tabela de movimentação de veículo incompatível com o backend atual.",
    );
  }

  const gasolinaCol = encontrarColuna(columns, ["gasolina"]);
  const limpezaCol = encontrarColuna(columns, ["nivel_limpeza", "nivelLimpeza"]);
  const estadoCol = encontrarColuna(columns, ["estado"]);
  const modoCol = encontrarColuna(columns, ["modo"]);
  const obsCol = encontrarColuna(columns, ["obs", "observacao"]);
  const litrosCol = encontrarColuna(columns, ["litrosAbastecidos", "litros_abastecidos"]);
  const postoCol = encontrarColuna(columns, ["postoAbastecimento", "posto_abastecimento"]);

  const columnsAndValues = [];
  const replacements = {};

  const addValue = (columnName, value) => {
    if (!columnName) return;
    const key = `p${columnsAndValues.length}`;
    columnsAndValues.push({ columnName, key });
    replacements[key] = value;
  };

  addValue(idCol, randomUUID());
  addValue(veiculoCol, dados.veiculoId);
  addValue(usuarioCol, dados.usuarioId);
  addValue(tipoCol, dados.tipo);
  addValue(kmCol, dados.km);
  addValue(dataCol, dados.dataMovimentacao);
  addValue(gasolinaCol, dados.gasolina ?? null);
  addValue(limpezaCol, dados.nivel_limpeza ?? null);
  addValue(estadoCol, dados.estado ?? null);
  addValue(modoCol, dados.modo ?? null);
  addValue(obsCol, dados.obs ?? null);
  addValue(litrosCol, dados.litrosAbastecidos ?? 0);
  addValue(postoCol, dados.postoAbastecimento ?? "");

  const insertColumnsSql = columnsAndValues
    .map(({ columnName }) => quoteIdent(columnName))
    .join(", ");
  const insertValuesSql = columnsAndValues
    .map(({ key }) => `:${key}`)
    .join(", ");

  const sql = `
    INSERT INTO ${quoteIdent(tableName)} (${insertColumnsSql})
    VALUES (${insertValuesSql})
    RETURNING *
  `;

  const [rows] = await sequelize.query(sql, { replacements });
  return rows?.[0] || null;
};

const ehErroDeSchemaMovimentacao = (error) => {
  const code = error?.original?.code || error?.parent?.code;
  return (
    code === "42P01" || // undefined_table
    code === "42703" || // undefined_column
    code === "23502" || // not_null_violation
    code === "22P02" // invalid_text_representation
  );
};
// Buscar a última movimentação de cada veículo
export const ultimasMovimentacoesPorVeiculo = async (req, res) => {
  try {
    // Busca todas as últimas movimentações para cada veículo
    const ultimas = await MovimentacaoVeiculo.findAll({
      attributes: [
        [Sequelize.col("veiculoid"), "veiculoId"],
        [Sequelize.fn("MAX", Sequelize.col("datahora")), "ultimaDataHora"],
      ],
      group: ["veiculoid"],
      raw: true,
    });

    // Buscar os detalhes completos das últimas movimentações, incluindo o campo km
    const ultimasDetalhes = await Promise.all(
      ultimas.map(async (u) => {
        const mov = await MovimentacaoVeiculo.findOne({
          where: {
            veiculoId: u.veiculoId,
            dataMovimentacao: u.ultimaDataHora,
          },
          attributes: [
            'id',
            'veiculoId',
            'tipo',
            'dataMovimentacao',
            'estado',
            'nivel_limpeza',
            'gasolina',
            'modo',
            'obs',
            'km',
            'litrosAbastecidos',
            'postoAbastecimento',
          ],
          include: [
            {
              model: Veiculo,
              as: "veiculo",
              attributes: ["id", "nome", "modelo"],
            },
            {
              model: Usuario,
              as: "usuario",
              attributes: ["id", "nome", "email"],
            },
          ],
        });
        return mov ? mov.toJSON() : null;
      }),
    );
    // Retorna um objeto { [veiculoId]: movimentacao }
    const resultado = {};
    ultimasDetalhes.forEach((mov) => {
      if (mov && mov.veiculoId) resultado[mov.veiculoId] = mov;
    });
    res.json(resultado);
  } catch (error) {
    console.error("Erro ao buscar últimas movimentações por veículo:", error);
    res
      .status(500)
      .json({ error: "Erro ao buscar últimas movimentações por veículo" });
  }
};

// Registrar movimentação (retirada ou devolução)
export const registrarMovimentacaoVeiculo = async (req, res) => {
  try {
    const {
      veiculoId,
      tipo,
      gasolina,
      nivel_limpeza,
      estado,
      modo,
      obs,
      dataMovimentacao,
      km,
      litrosAbastecidos,
      postoAbastecimento,
    } = req.body;
    const usuarioId = req.usuario?.id;
    const tipoNormalizado =
      typeof tipo === "string" ? tipo.trim().toLowerCase() : tipo;
    const kmNormalizado =
      typeof km === "string" && km.trim() !== "" ? Number(km) : km;
    const litrosAbastecidosNormalizados =
      litrosAbastecidos === null ||
      litrosAbastecidos === undefined ||
      (typeof litrosAbastecidos === "string" &&
        litrosAbastecidos.trim() === "")
        ? null
        : Number(litrosAbastecidos);
    const postoAbastecimentoNormalizado =
      typeof postoAbastecimento === "string"
        ? postoAbastecimento.trim()
        : postoAbastecimento ?? null;

    if (!veiculoId || !tipoNormalizado || !usuarioId) {
      return res.status(400).json({ error: "Dados obrigatórios ausentes." });
    }
    if (!["retirada", "devolucao"].includes(tipoNormalizado)) {
      return res.status(400).json({
        error: "O tipo da movimentação deve ser 'retirada' ou 'devolucao'.",
      });
    }
    // Validação de KM obrigatório e mínimo para qualquer movimentação
    const veiculo = await Veiculo.findByPk(veiculoId);
    if (!veiculo) {
      return res.status(404).json({ error: 'Veículo não encontrado.' });
    }
    // Buscar a última movimentação desse veículo (com KM informado)
    const ultimaMovimentacaoVeiculo = await MovimentacaoVeiculo.findOne({
      where: { veiculoId },
      order: [['dataMovimentacao', 'DESC']]
    });

    const ultimaMov = await MovimentacaoVeiculo.findOne({
      where: { veiculoId, km: { [Op.ne]: null } },
      order: [['dataMovimentacao', 'DESC']]
    });
    const kmUltimaMov = ultimaMov?.km ?? 0;
    const kmAtualVeiculo = veiculo.km ?? 0;
    const kmReferencia = Math.max(kmUltimaMov, kmAtualVeiculo);
    if (!Number.isInteger(kmNormalizado) || kmNormalizado < 0) {
      return res.status(400).json({
        error: 'O campo km é obrigatório e deve ser um número inteiro válido.',
      });
    }
    const isFuncionario = req.usuario?.role === 'FUNCIONARIO';
    const isAdmin = req.usuario?.role === 'ADMIN';
    const exigeDadosAbastecimento =
      isFuncionario && tipoNormalizado === 'devolucao';
    const devolucaoDeOutroUsuario =
      tipoNormalizado === 'devolucao' &&
      ultimaMovimentacaoVeiculo?.tipo === 'retirada' &&
      ultimaMovimentacaoVeiculo.usuarioId &&
      ultimaMovimentacaoVeiculo.usuarioId !== usuarioId;

    if (devolucaoDeOutroUsuario && !isAdmin) {
      return res.status(403).json({
        error: 'Apenas administradores podem devolver veiculo em uso por outro usuario.',
      });
    }

    if (isFuncionario && kmNormalizado < kmReferencia) {
      return res.status(400).json({ error: 'O KM informado não pode ser menor que o último KM registrado para este veículo.' });
    }
    if (
      litrosAbastecidosNormalizados !== null &&
      (!Number.isFinite(litrosAbastecidosNormalizados) ||
        litrosAbastecidosNormalizados < 0)
    ) {
      return res.status(400).json({
        error: 'O campo litros abastecidos deve ser um número válido.',
      });
    }
    if (exigeDadosAbastecimento && litrosAbastecidosNormalizados === null) {
      return res.status(400).json({ error: 'O campo litros abastecidos é obrigatório.' });
    }
    if (exigeDadosAbastecimento && !postoAbastecimentoNormalizado) {
      return res.status(400).json({ error: 'O campo posto de abastecimento é obrigatório.' });
    }

    // Compatibilidade com bancos antigos que ainda têm NOT NULL nesses campos.
    const litrosAbastecidosParaSalvar =
      tipoNormalizado === 'devolucao'
        ? litrosAbastecidosNormalizados ?? 0
        : 0;
    const postoAbastecimentoParaSalvar =
      tipoNormalizado === 'devolucao'
        ? postoAbastecimentoNormalizado || ''
        : '';

    // Persistir movimentação
    const payloadMovimentacao = {
      veiculoId,
      usuarioId,
      tipo: tipoNormalizado,
      dataMovimentacao: dataMovimentacao || new Date(),
      gasolina,
      nivel_limpeza,
      estado,
      modo,
      obs,
      km: kmNormalizado,
      litrosAbastecidos: litrosAbastecidosParaSalvar,
      postoAbastecimento: postoAbastecimentoParaSalvar,
    };

    let movimentacao;
    try {
      movimentacao = await MovimentacaoVeiculo.create(payloadMovimentacao);
    } catch (erroCriacao) {
      if (!ehErroDeSchemaMovimentacao(erroCriacao)) {
        throw erroCriacao;
      }

      console.warn(
        "Fallback de schema ativado para gravacao de movimentacao de veiculo:",
        erroCriacao.message,
      );

      const movimentacaoLegado = await inserirMovimentacaoNoSchemaLegado(payloadMovimentacao);
      await veiculo.update({
        emUso: tipoNormalizado === 'retirada',
        km: Math.max(kmNormalizado, veiculo.km ?? 0),
        estado: estado ?? veiculo.estado,
        modo: modo ?? veiculo.modo,
        nivelCombustivel: gasolina ?? veiculo.nivelCombustivel,
        nivelLimpeza: nivel_limpeza ?? veiculo.nivelLimpeza,
        litrosAbastecidos: litrosAbastecidosParaSalvar,
        postoAbastecimento: postoAbastecimentoParaSalvar,
      });
      return res.status(201).json(normalizarRetornoMovimentacao(movimentacaoLegado));
    }

    await veiculo.update({
      emUso: tipoNormalizado === 'retirada',
      km: Math.max(kmNormalizado, veiculo.km ?? 0),
      estado: estado ?? veiculo.estado,
      modo: modo ?? veiculo.modo,
      nivelCombustivel: gasolina ?? veiculo.nivelCombustivel,
      nivelLimpeza: nivel_limpeza ?? veiculo.nivelLimpeza,
      litrosAbastecidos: litrosAbastecidosParaSalvar,
      postoAbastecimento: postoAbastecimentoParaSalvar,
    });

    res.status(201).json(movimentacao);
  } catch (error) {
    console.error("Erro ao registrar movimentação de veículo:", error);
    res
      .status(500)
      .json({ error: "Erro ao registrar movimentação de veículo", details: error.message });
  }
};

// Listar movimentações com filtro por veiculo e data
export const listarMovimentacoesVeiculo = async (req, res) => {
  try {
    const { veiculoId, dataInicio, dataFim } = req.query;
    const where = {};
    if (veiculoId) where.veiculoId = veiculoId;
    let inicio, fim;
    if (dataInicio && dataFim) {
      inicio = new Date(dataInicio + "T00:00:00.000Z");
      fim = new Date(dataFim + "T23:59:59.999Z");
      where.dataMovimentacao = { [Op.gte]: inicio, [Op.lte]: fim };
      console.log("[Filtro] Período:", { dataInicio, dataFim, inicio, fim });
    } else if (dataInicio && !dataFim) {
      inicio = new Date(dataInicio + "T00:00:00.000Z");
      fim = new Date(dataInicio + "T23:59:59.999Z");
      where.dataMovimentacao = { [Op.gte]: inicio, [Op.lte]: fim };
      console.log("[Filtro] Só início:", { dataInicio, inicio, fim });
    } else if (!dataInicio && dataFim) {
      fim = new Date(dataFim + "T23:59:59.999Z");
      where.dataMovimentacao = { [Op.lte]: fim };
      console.log("[Filtro] Só fim:", { dataFim, fim });
    }
    console.log("[Filtro] where:", JSON.stringify(where));
    const movimentacoes = await MovimentacaoVeiculo.findAll({
      where,
      include: [
        { model: Veiculo, as: "veiculo", attributes: ["id", "nome", "modelo"] },
        { model: Usuario, as: "usuario", attributes: ["id", "nome", "email"] },
      ],
      order: [["dataMovimentacao", "DESC"]],
    });
    res.json(movimentacoes);
  } catch (error) {
    console.error("Erro ao listar movimentações de veículo:", error);
    res.status(500).json({ error: "Erro ao listar movimentações de veículo" });
  }
};
