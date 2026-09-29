import assert from "node:assert/strict";
import test from "node:test";
import { autorizarRole } from "../src/middlewares/auth.js";
import {
  criarAtualizadorManutencao,
  ManutencaoServiceError,
} from "../src/services/manutencaoService.js";

const IDs = {
  manutencao: "manutencao-1",
  lojaA: "loja-a",
  lojaB: "loja-b",
  maquinaA: "maquina-a",
  maquinaB: "maquina-b",
  funcionario: "funcionario-1",
  funcionarioSemVinculo: "funcionario-2",
  roteiro: "roteiro-1",
};

const criarCenario = ({
  lojaId = IDs.lojaA,
  maquinaId = null,
  funcionarioId = IDs.funcionario,
  roteiroId = IDs.roteiro,
  lojasPermitidas = [],
} = {}) => {
  const banco = {
    manutencoes: new Map([
      [
        IDs.manutencao,
        {
          id: IDs.manutencao,
          lojaId,
          maquinaId,
          funcionarioId,
          roteiroId,
          status: "pendente",
          descricao: "Descrição anterior",
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
        },
      ],
    ]),
    lojas: new Map([
      [IDs.lojaA, { id: IDs.lojaA, nome: "Loja A" }],
      [IDs.lojaB, { id: IDs.lojaB, nome: "Loja B" }],
    ]),
    maquinas: new Map([
      [
        IDs.maquinaA,
        { id: IDs.maquinaA, nome: "Máquina A", lojaId: IDs.lojaA },
      ],
      [
        IDs.maquinaB,
        { id: IDs.maquinaB, nome: "Máquina B", lojaId: IDs.lojaB },
      ],
    ]),
    usuarios: new Map([
      [
        IDs.funcionario,
        { id: IDs.funcionario, nome: "Funcionário", role: "FUNCIONARIO" },
      ],
      [
        IDs.funcionarioSemVinculo,
        {
          id: IDs.funcionarioSemVinculo,
          nome: "Funcionário 2",
          role: "FUNCIONARIO",
        },
      ],
    ]),
    roteiros: new Map([
      [IDs.roteiro, { id: IDs.roteiro, funcionarioId: IDs.funcionario }],
    ]),
    usuarioLojas: lojasPermitidas.map(({ usuarioId, lojaId }) => ({
      usuarioId,
      lojaId,
    })),
  };

  let transacoesConfirmadas = 0;

  const sequelizeInstance = {
    async transaction(callback) {
      const transaction = { LOCK: { UPDATE: "UPDATE" } };
      const resultado = await callback(transaction);
      transacoesConfirmadas += 1;
      return resultado;
    },
  };

  const criarInstancia = (registro) => ({
    ...registro,
    async save({ transaction }) {
      assert.ok(transaction);
      banco.manutencoes.set(this.id, {
        id: this.id,
        lojaId: this.lojaId,
        maquinaId: this.maquinaId,
        funcionarioId: this.funcionarioId,
        roteiroId: this.roteiroId,
        status: this.status,
        descricao: this.descricao,
        createdAt: this.createdAt,
      });
    },
  });

  const ManutencaoModel = {
    async findByPk(id, options) {
      assert.ok(options.transaction);
      const registro = banco.manutencoes.get(id);
      if (!registro) return null;

      if (options.include) {
        return {
          ...registro,
          loja: banco.lojas.get(registro.lojaId) || null,
          maquina: banco.maquinas.get(registro.maquinaId) || null,
          funcionario: banco.usuarios.get(registro.funcionarioId) || null,
        };
      }

      return criarInstancia(registro);
    },
  };

  const atualizar = criarAtualizadorManutencao({
    sequelizeInstance,
    ManutencaoModel,
    LojaModel: {
      findByPk: async (id, options) => {
        assert.ok(options.transaction);
        return banco.lojas.get(id) || null;
      },
    },
    MaquinaModel: {
      findByPk: async (id, options) => {
        assert.ok(options.transaction);
        return banco.maquinas.get(id) || null;
      },
    },
    UsuarioModel: {
      findByPk: async (id, options) => {
        assert.ok(options.transaction);
        return banco.usuarios.get(id) || null;
      },
    },
    RoteiroModel: {
      findByPk: async (id, options) => {
        assert.ok(options.transaction);
        return banco.roteiros.get(id) || null;
      },
    },
    UsuarioLojaModel: {
      findOne: async (options) => {
        assert.ok(options.transaction);
        const { usuarioId, lojaId } = options.where;
        return (
          banco.usuarioLojas.find(
            (permissao) =>
              permissao.usuarioId === usuarioId && permissao.lojaId === lojaId,
          ) || null
        );
      },
    },
    include: [{ as: "loja" }, { as: "maquina" }, { as: "funcionario" }],
  });

  return {
    atualizar,
    banco,
    transacoesConfirmadas: () => transacoesConfirmadas,
  };
};

const rejeitaComStatus = async (promise, status) => {
  await assert.rejects(promise, (error) => {
    assert.ok(error instanceof ManutencaoServiceError);
    assert.equal(error.status, status);
    return true;
  });
};

test("altera somente a loja e preserva os campos ausentes", async () => {
  const cenario = criarCenario();
  const resultado = await cenario.atualizar({
    id: IDs.manutencao,
    payload: { lojaId: IDs.lojaB },
  });

  assert.equal(resultado.lojaId, IDs.lojaB);
  assert.equal(resultado.maquinaId, null);
  assert.equal(resultado.status, "pendente");
  assert.equal(resultado.descricao, "Descrição anterior");
  assert.equal(resultado.loja.id, IDs.lojaB);
});

test("altera loja e máquina compatíveis", async () => {
  const cenario = criarCenario({ maquinaId: IDs.maquinaA });
  const resultado = await cenario.atualizar({
    id: IDs.manutencao,
    payload: { lojaId: IDs.lojaB, maquinaId: IDs.maquinaB },
  });

  assert.equal(resultado.loja.id, IDs.lojaB);
  assert.equal(resultado.maquina.id, IDs.maquinaB);
});

test("remove a máquina com maquinaId null", async () => {
  const cenario = criarCenario({ maquinaId: IDs.maquinaA });
  const resultado = await cenario.atualizar({
    id: IDs.manutencao,
    payload: { maquinaId: null },
  });

  assert.equal(resultado.maquinaId, null);
  assert.equal(resultado.maquina, null);
});

test("rejeita máquina pertencente a outra loja", async () => {
  const cenario = criarCenario();
  await rejeitaComStatus(
    cenario.atualizar({
      id: IDs.manutencao,
      payload: { maquinaId: IDs.maquinaB },
    }),
    409,
  );
  assert.equal(cenario.transacoesConfirmadas(), 0);
});

test("retorna 404 para loja inexistente", async () => {
  const cenario = criarCenario();
  await rejeitaComStatus(
    cenario.atualizar({
      id: IDs.manutencao,
      payload: { lojaId: "loja-inexistente" },
    }),
    404,
  );
});

test("retorna 404 para máquina inexistente", async () => {
  const cenario = criarCenario();
  await rejeitaComStatus(
    cenario.atualizar({
      id: IDs.manutencao,
      payload: { maquinaId: "maquina-inexistente" },
    }),
    404,
  );
});

test("usuário sem autorização recebe 403", () => {
  const middleware = autorizarRole("ADMIN");
  const req = { usuario: { role: "FUNCIONARIO" } };
  let statusRecebido;
  let corpoRecebido;

  const res = {
    status(status) {
      statusRecebido = status;
      return this;
    },
    json(corpo) {
      corpoRecebido = corpo;
      return this;
    },
  };

  middleware(req, res, () => assert.fail("next não deveria ser chamado"));

  assert.equal(statusRecebido, 403);
  assert.match(corpoRecebido.error, /permissão/i);
});

test("autoriza funcionario na rota de atualizacao de manutencao", () => {
  const middleware = autorizarRole("ADMIN", "FUNCIONARIO");
  const req = { usuario: { role: "FUNCIONARIO" } };

  middleware(req, {}, () => assert.ok(true));
});

test("funcionario vinculado marca manutencao como feita", async () => {
  const cenario = criarCenario();
  const resultado = await cenario.atualizar({
    id: IDs.manutencao,
    payload: { status: "feito" },
    usuario: { id: IDs.funcionario, role: "FUNCIONARIO" },
  });

  assert.equal(resultado.status, "feito");
  assert.match(resultado.descricao, /anterior/);
  assert.notEqual(
    cenario.banco.manutencoes.get(IDs.manutencao).createdAt.toISOString(),
    "2026-01-01T00:00:00.000Z",
  );
});

test("funcionario nao pode alterar outros campos da manutencao", async () => {
  const cenario = criarCenario();

  await rejeitaComStatus(
    cenario.atualizar({
      id: IDs.manutencao,
      payload: { descricao: "nova descricao" },
      usuario: { id: IDs.funcionario, role: "FUNCIONARIO" },
    }),
    403,
  );
});

test("funcionario nao pode enviar status feito com campos extras", async () => {
  const cenario = criarCenario();

  await rejeitaComStatus(
    cenario.atualizar({
      id: IDs.manutencao,
      payload: { status: "feito", descricao: "nova descricao" },
      usuario: { id: IDs.funcionario, role: "FUNCIONARIO" },
    }),
    403,
  );
});

test("funcionario sem vinculo com manutencao, roteiro ou loja recebe 403", async () => {
  const cenario = criarCenario({
    funcionarioId: null,
    roteiroId: null,
  });

  await rejeitaComStatus(
    cenario.atualizar({
      id: IDs.manutencao,
      payload: { status: "feito" },
      usuario: { id: IDs.funcionarioSemVinculo, role: "FUNCIONARIO" },
    }),
    403,
  );
});

test("funcionario com permissao na loja pode marcar manutencao como feita", async () => {
  const cenario = criarCenario({
    funcionarioId: null,
    roteiroId: null,
    lojasPermitidas: [
      { usuarioId: IDs.funcionarioSemVinculo, lojaId: IDs.lojaA },
    ],
  });

  const resultado = await cenario.atualizar({
    id: IDs.manutencao,
    payload: { status: "feito" },
    usuario: { id: IDs.funcionarioSemVinculo, role: "FUNCIONARIO" },
  });

  assert.equal(resultado.status, "feito");
});

test("confirma que os novos IDs foram persistidos antes do retorno", async () => {
  const cenario = criarCenario({ maquinaId: IDs.maquinaA });
  await cenario.atualizar({
    id: IDs.manutencao,
    payload: { lojaId: IDs.lojaB, maquinaId: IDs.maquinaB },
  });

  const persistido = cenario.banco.manutencoes.get(IDs.manutencao);
  assert.equal(persistido.lojaId, IDs.lojaB);
  assert.equal(persistido.maquinaId, IDs.maquinaB);
  assert.equal(cenario.transacoesConfirmadas(), 1);
});
