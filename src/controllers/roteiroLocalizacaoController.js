import { QueryTypes } from "sequelize";
import {
  Roteiro,
  RoteiroLocalizacao,
  Usuario,
  sequelize,
} from "../models/index.js";

const JANELA_LOCALIZACAO_MINUTOS = 10;

const toNumberOrNull = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
};

const serializarLocalizacao = (localizacao, incluirDetalhes = false) => ({
  ...(incluirDetalhes ? { id: localizacao.id } : {}),
  roteiroId: localizacao.roteiroId,
  usuarioId: localizacao.usuarioId,
  usuarioNome: localizacao.usuario?.nome,
  latitude: Number(localizacao.latitude),
  longitude: Number(localizacao.longitude),
  accuracy: localizacao.accuracy === null ? undefined : Number(localizacao.accuracy),
  ...(incluirDetalhes
    ? {
        altitude: localizacao.altitude === null ? null : Number(localizacao.altitude),
        heading: localizacao.heading === null ? null : Number(localizacao.heading),
        speed: localizacao.speed === null ? null : Number(localizacao.speed),
        ativa: localizacao.ativa,
        encerradaEm: localizacao.encerradaEm?.toISOString?.() || localizacao.encerradaEm,
      }
    : {}),
  capturedAt: localizacao.capturedAt?.toISOString?.() || localizacao.capturedAt,
  updatedAt: localizacao.updatedAt?.toISOString?.() || localizacao.updatedAt,
});

const validarFuncionarioDoRoteiro = async (roteiroId, usuario) => {
  const roteiro = await Roteiro.findByPk(roteiroId);

  if (!roteiro) {
    return { status: 404, error: "Roteiro nao encontrado" };
  }

  if (!roteiro.funcionarioId) {
    if (usuario.role !== "FUNCIONARIO") {
      return { status: 403, error: "Roteiro nao possui funcionario responsavel" };
    }

    await roteiro.update({
      funcionarioId: usuario.id,
      funcionarioNome: usuario.nome,
      status: roteiro.status === "pendente" ? "em_andamento" : roteiro.status,
    });

    return { roteiro };
  }

  if (roteiro.funcionarioId !== usuario.id) {
    return { status: 403, error: "Usuario autenticado nao e o responsavel por este roteiro" };
  }

  return { roteiro };
};

export const salvarLocalizacaoRoteiro = async (req, res) => {
  try {
    const { roteiroId } = req.params;
    const usuarioId = req.usuario.id;
    const permissao = await validarFuncionarioDoRoteiro(roteiroId, req.usuario);

    if (permissao.error) {
      return res.status(permissao.status).json({ error: permissao.error });
    }

    const latitude = Number(req.body.latitude);
    const longitude = Number(req.body.longitude);
    const accuracy = toNumberOrNull(req.body.accuracy);
    const altitude = toNumberOrNull(req.body.altitude);
    const heading = toNumberOrNull(req.body.heading);
    const speed = toNumberOrNull(req.body.speed);
    const capturedAt = new Date(req.body.capturedAt);

    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      return res.status(400).json({ error: "latitude invalida" });
    }

    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      return res.status(400).json({ error: "longitude invalida" });
    }

    if (Number.isNaN(accuracy) || Number.isNaN(altitude) || Number.isNaN(heading) || Number.isNaN(speed)) {
      return res.status(400).json({ error: "Campos numericos opcionais invalidos" });
    }

    if (Number.isNaN(capturedAt.getTime())) {
      return res.status(400).json({ error: "capturedAt invalido" });
    }

    const [localizacao] = await RoteiroLocalizacao.upsert(
      {
        roteiroId,
        usuarioId,
        latitude,
        longitude,
        accuracy,
        altitude,
        heading,
        speed,
        capturedAt,
        ativa: true,
        encerradaEm: null,
      },
      { returning: true }
    );

    const localizacaoSalva = await RoteiroLocalizacao.findByPk(localizacao.id, {
      include: [{ model: Usuario, as: "usuario", attributes: ["id", "nome"] }],
    });

    return res.status(200).json(serializarLocalizacao(localizacaoSalva, true));
  } catch (error) {
    console.error("Erro ao salvar localizacao do roteiro:", error);
    return res.status(500).json({ error: "Erro ao salvar localizacao do roteiro" });
  }
};

export const encerrarLocalizacaoRoteiro = async (req, res) => {
  try {
    const { roteiroId } = req.params;
    const usuarioId = req.usuario.id;

    const roteiro = await Roteiro.findByPk(roteiroId);
    if (!roteiro) {
      return res.status(404).json({ error: "Roteiro nao encontrado" });
    }

    await encerrarLocalizacoesAtivasDoRoteiro(roteiroId, usuarioId);

    return res.status(204).send();
  } catch (error) {
    console.error("Erro ao encerrar localizacao do roteiro:", error);
    return res.status(500).json({ error: "Erro ao encerrar localizacao do roteiro" });
  }
};

export const encerrarLocalizacoesAtivasDoRoteiro = async (roteiroId, usuarioId = null, transaction = null) => {
  const where = {
    roteiroId,
    ativa: true,
  };

  if (usuarioId) {
    where.usuarioId = usuarioId;
  }

  return RoteiroLocalizacao.update(
    {
      ativa: false,
      encerradaEm: new Date(),
    },
    { where, transaction }
  );
};

export const obterStatusMinhaLocalizacaoRoteiro = async (req, res) => {
  try {
    const { roteiroId } = req.params;
    const usuarioId = req.usuario.id;

    const roteiro = await Roteiro.findByPk(roteiroId);
    if (!roteiro) {
      return res.status(404).json({ error: "Roteiro nao encontrado" });
    }

    const localizacao = await RoteiroLocalizacao.findOne({
      where: { roteiroId, usuarioId },
      order: [["updatedAt", "DESC"]],
    });

    if (!localizacao) {
      return res.json({
        roteiroId,
        usuarioId,
        ativa: false,
        deveCompartilhar: false,
        ultimaLocalizacao: null,
      });
    }

    return res.json({
      roteiroId,
      usuarioId,
      ativa: localizacao.ativa,
      deveCompartilhar: localizacao.ativa && roteiro.status !== "concluido",
      ultimaLocalizacao: serializarLocalizacao(localizacao, true),
    });
  } catch (error) {
    console.error("Erro ao obter status da localizacao do roteiro:", error);
    return res.status(500).json({ error: "Erro ao obter status da localizacao do roteiro" });
  }
};

export const listarLocalizacoesAtivas = async (req, res) => {
  try {
    if (req.usuario.role !== "ADMIN") {
      return res.status(403).json({ error: "Acesso negado. Apenas ADMIN." });
    }

    const localizacoes = await sequelize.query(
      `
        SELECT
          rl.roteiro_id AS "roteiroId",
          rl.usuario_id AS "usuarioId",
          u.nome AS "usuarioNome",
          rl.latitude::float AS "latitude",
          rl.longitude::float AS "longitude",
          rl.accuracy::float AS "accuracy",
          rl.captured_at AS "capturedAt",
          rl.updated_at AS "updatedAt",
          rl.ativa AS "ativa",
          rl.encerrada_em AS "encerradaEm",
          (GREATEST(rl.updated_at, rl.captured_at) >= NOW() - INTERVAL '10 minutes') AS "recente",
          FLOOR(EXTRACT(EPOCH FROM (NOW() - GREATEST(rl.updated_at, rl.captured_at))) / 60)::int AS "minutosSemAtualizar"
        FROM roteiros_localizacoes rl
        JOIN usuarios u ON u.id = rl.usuario_id
        ORDER BY
          rl.ativa DESC,
          GREATEST(rl.updated_at, rl.captured_at) DESC
      `,
      {
        type: QueryTypes.SELECT,
      }
    );

    return res.json(localizacoes);
  } catch (error) {
    if (error?.original?.code === "42P01" || error?.parent?.code === "42P01") {
      console.warn("Tabela roteiros_localizacoes nao existe. Execute MIGRATION_ROTEIRO_LOCALIZACOES.sql.");
      return res.json([]);
    }

    console.error("Erro ao listar localizacoes ativas:", error);
    return res.status(500).json({ error: "Erro ao listar localizacoes ativas" });
  }
};
