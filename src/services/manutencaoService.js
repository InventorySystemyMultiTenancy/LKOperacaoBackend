import { sequelize } from "../database/connection.js";
import {
  Loja,
  Manutencao,
  Maquina,
  Roteiro,
  Usuario,
  UsuarioLoja,
} from "../models/index.js";

export class ManutencaoServiceError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "ManutencaoServiceError";
    this.status = status;
  }
}

const possuiCampo = (objeto, campo) =>
  Object.prototype.hasOwnProperty.call(objeto, campo);

const normalizarStatus = (valor) =>
  String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const statusConclusao = new Set([
  "feito",
  "concluido",
  "concluida",
  "finalizado",
  "finalizada",
]);

const erroAcessoNegado =
  "Acesso negado. Você não tem permissão para esta ação.";

const validarPermissaoFuncionario = async ({
  usuario,
  payload,
  manutencao,
  RoteiroModel,
  UsuarioLojaModel,
  transaction,
}) => {
  if (usuario?.role !== "FUNCIONARIO") return;

  const campos = Object.keys(payload || {});
  const payloadPermitido =
    campos.length === 1 &&
    possuiCampo(payload, "status") &&
    normalizarStatus(payload.status) === "feito";

  if (!payloadPermitido) {
    throw new ManutencaoServiceError(403, erroAcessoNegado);
  }

  if (manutencao.funcionarioId === usuario.id) return;

  if (manutencao.roteiroId && RoteiroModel) {
    const roteiro = await RoteiroModel.findByPk(manutencao.roteiroId, {
      transaction,
    });
    if (roteiro?.funcionarioId === usuario.id) return;
  }

  if (manutencao.lojaId && UsuarioLojaModel) {
    const permissaoLoja = await UsuarioLojaModel.findOne({
      where: { usuarioId: usuario.id, lojaId: manutencao.lojaId },
      transaction,
    });
    if (permissaoLoja) return;
  }

  throw new ManutencaoServiceError(403, erroAcessoNegado);
};

export const manutencaoInclude = [
  {
    model: Loja,
    as: "loja",
    attributes: ["id", "nome", "endereco", "cidade", "estado"],
  },
  { model: Maquina, as: "maquina", attributes: ["id", "nome"] },
  { model: Usuario, as: "funcionario", attributes: ["id", "nome"] },
];

export const criarAtualizadorManutencao = ({
  sequelizeInstance,
  ManutencaoModel,
  LojaModel,
  MaquinaModel,
  UsuarioModel,
  RoteiroModel = null,
  UsuarioLojaModel = null,
  include = manutencaoInclude,
}) => async ({ id, payload, usuario = null }) =>
  sequelizeInstance.transaction(async (transaction) => {
    const manutencao = await ManutencaoModel.findByPk(id, {
      transaction,
      lock: transaction.LOCK?.UPDATE,
    });

    if (!manutencao) {
      throw new ManutencaoServiceError(404, "Manutenção não encontrada");
    }

    await validarPermissaoFuncionario({
      usuario,
      payload,
      manutencao,
      RoteiroModel,
      UsuarioLojaModel,
      transaction,
    });

    const alteraLoja = possuiCampo(payload, "lojaId");
    const alteraMaquina = possuiCampo(payload, "maquinaId");
    const lojaIdFinal = alteraLoja ? payload.lojaId : manutencao.lojaId;
    const maquinaIdFinal = alteraMaquina
      ? payload.maquinaId
      : manutencao.maquinaId;

    if (alteraLoja && lojaIdFinal !== null) {
      const loja = await LojaModel.findByPk(lojaIdFinal, { transaction });
      if (!loja) {
        throw new ManutencaoServiceError(404, "Loja não encontrada");
      }
    }

    let maquina = null;
    if ((alteraLoja || alteraMaquina) && maquinaIdFinal !== null) {
      maquina = await MaquinaModel.findByPk(maquinaIdFinal, { transaction });
      if (!maquina) {
        throw new ManutencaoServiceError(404, "Máquina não encontrada");
      }
    }

    if (maquina && maquina.lojaId !== lojaIdFinal) {
      throw new ManutencaoServiceError(
        409,
        "A máquina informada não pertence à loja selecionada",
      );
    }

    if (alteraLoja) manutencao.lojaId = lojaIdFinal;
    if (alteraMaquina) manutencao.maquinaId = maquinaIdFinal;

    if (possuiCampo(payload, "funcionarioId")) {
      if (payload.funcionarioId === null) {
        manutencao.funcionarioId = null;
      } else {
        const funcionario = await UsuarioModel.findByPk(payload.funcionarioId, {
          transaction,
        });
        if (!funcionario) {
          throw new ManutencaoServiceError(400, "Funcionário não encontrado");
        }
        if (funcionario.role !== "FUNCIONARIO") {
          throw new ManutencaoServiceError(
            400,
            "Usuário informado não possui role FUNCIONARIO",
          );
        }
        manutencao.funcionarioId = payload.funcionarioId;
      }
    }

    if (possuiCampo(payload, "status")) {
      const estavaConcluida = statusConclusao.has(
        normalizarStatus(manutencao.status),
      );
      const virouConcluida = statusConclusao.has(
        normalizarStatus(payload.status),
      );

      manutencao.status = payload.status;
      if (!estavaConcluida && virouConcluida) {
        manutencao.createdAt = new Date();
      }
    }

    if (possuiCampo(payload, "descricao")) {
      manutencao.descricao = payload.descricao;
    }

    await manutencao.save({ transaction });

    return ManutencaoModel.findByPk(manutencao.id, {
      transaction,
      include,
    });
  });

export const atualizarManutencaoPersistida = criarAtualizadorManutencao({
  sequelizeInstance: sequelize,
  ManutencaoModel: Manutencao,
  LojaModel: Loja,
  MaquinaModel: Maquina,
  UsuarioModel: Usuario,
  RoteiroModel: Roteiro,
  UsuarioLojaModel: UsuarioLoja,
});
