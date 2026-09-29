// Associação Manutencao <-> Usuario (funcionário responsável)
Manutencao.belongsTo(Usuario, { foreignKey: "funcionarioId", as: "funcionario" });
Usuario.hasMany(Manutencao, { foreignKey: "funcionarioId", as: "manutencoesResponsavel" });
// Manutencao <-> Roteiro
Manutencao.belongsTo(Roteiro, { foreignKey: "roteiroId", as: "roteiro" });
Roteiro.hasMany(Manutencao, { foreignKey: "roteiroId", as: "manutencoes" });
// Manutencao <-> Loja
Manutencao.belongsTo(Loja, { foreignKey: "lojaId", as: "loja" });
Loja.hasMany(Manutencao, { foreignKey: "lojaId", as: "manutencoes" });
import Usuario from "./Usuario.js";
import Loja from "./Loja.js";
import Maquina from "./Maquina.js";
import Produto from "./Produto.js";
import Movimentacao from "./Movimentacao.js";
import MovimentacaoProduto from "./MovimentacaoProduto.js";
import LogAtividade from "./LogAtividade.js";
import UsuarioLoja from "./UsuarioLoja.js";
import EstoqueLoja from "./EstoqueLoja.js";
import MovimentacaoEstoqueLoja from "./MovimentacaoEstoqueLoja.js";
import MovimentacaoEstoqueLojaProduto from "./MovimentacaoEstoqueLojaProduto.js";
import Roteiro from "./Roteiro.js";
import RoteiroLoja from "./RoteiroLoja.js";
import Manutencao from "./Manutencao.js";
import RoteiroGasto from "./RoteiroGasto.js";
import TemplateRoteiro from "./TemplateRoteiro.js";
import ComissaoLoja from "./ComissaoLoja.js";
import AReceberLoja from "./AReceberLoja.js";
import Veiculo from "./Veiculo.js";
import MovimentacaoVeiculo from "./MovimentacaoVeiculo.js";
import CarrinhoUsuario from "./CarrinhoUsuario.js";
import DevolucaoCarrinho from "./DevolucaoCarrinho.js";
import CarrinhoItem from "./CarrinhoItem.js";
import DevolucaoCarrinhoItem from "./DevolucaoCarrinhoItem.js";
import RoteiroLocalizacao from "./RoteiroLocalizacao.js";
import AlertaResolvido from "./AlertaResolvido.js";
import { sequelize } from "../database/connection.js";

// AlertaResolvido -> Usuario (quem marcou como resolvido)
AlertaResolvido.belongsTo(Usuario, { foreignKey: "usuarioId", as: "usuario" });

// Associação Manutencao <-> Maquina
Manutencao.belongsTo(Maquina, { foreignKey: "maquinaId", as: "maquina" });
Maquina.hasMany(Manutencao, { foreignKey: "maquinaId", as: "manutencoes" });

// Relacionamentos de MovimentacaoVeiculo
MovimentacaoVeiculo.belongsTo(Veiculo, {
  as: "veiculo",
  foreignKey: "veiculoId",
});
MovimentacaoVeiculo.belongsTo(Usuario, {
  as: "usuario",
  foreignKey: "usuarioId",
});

// Relacionamentos
MovimentacaoEstoqueLoja.belongsTo(Loja, { foreignKey: "lojaId", as: "loja" });
Loja.hasMany(MovimentacaoEstoqueLoja, {
  foreignKey: "lojaId",
  as: "movimentacoesEstoque",
});

MovimentacaoEstoqueLoja.belongsTo(Usuario, {
  foreignKey: "usuarioId",
  as: "usuario",
});
Usuario.hasMany(MovimentacaoEstoqueLoja, {
  foreignKey: "usuarioId",
  as: "movimentacoesEstoque",
});

// Loja -> Máquinas
Loja.hasMany(Maquina, { foreignKey: "lojaId", as: "maquinas" });
Maquina.belongsTo(Loja, { foreignKey: "lojaId", as: "loja" });

// Máquina -> Movimentações
Maquina.hasMany(Movimentacao, { foreignKey: "maquinaId", as: "movimentacoes" });
Movimentacao.belongsTo(Maquina, { foreignKey: "maquinaId", as: "maquina" });

// Usuário -> Movimentações
Usuario.hasMany(Movimentacao, { foreignKey: "usuarioId", as: "movimentacoes" });
Movimentacao.belongsTo(Usuario, { foreignKey: "usuarioId", as: "usuario" });

// Movimentação <-> Produtos (many-to-many)
Movimentacao.belongsToMany(Produto, {
  through: MovimentacaoProduto,
  foreignKey: "movimentacaoId",
  otherKey: "produtoId",
  as: "produtos",
});

Produto.belongsToMany(Movimentacao, {
  through: MovimentacaoProduto,
  foreignKey: "produtoId",
  otherKey: "movimentacaoId",
  as: "movimentacoes",
});

// Acesso direto à tabela intermediária
Movimentacao.hasMany(MovimentacaoProduto, {
  foreignKey: "movimentacaoId",
  as: "detalhesProdutos",
});
MovimentacaoProduto.belongsTo(Movimentacao, { foreignKey: "movimentacaoId" });
MovimentacaoProduto.belongsTo(Produto, {
  foreignKey: "produtoId",
  as: "produto",
});

// Usuário -> Logs
Usuario.hasMany(LogAtividade, { foreignKey: "usuarioId", as: "logs" });
LogAtividade.belongsTo(Usuario, { foreignKey: "usuarioId", as: "usuario" });

// Usuário <-> Lojas (RBAC - many-to-many)
Usuario.belongsToMany(Loja, {
  through: UsuarioLoja,
  foreignKey: "usuarioId",
  otherKey: "lojaId",
  as: "lojasPermitidas",
});

Loja.belongsToMany(Usuario, {
  through: UsuarioLoja,
  foreignKey: "lojaId",
  otherKey: "usuarioId",
  as: "usuariosPermitidos",
});

// Acesso direto à tabela UsuarioLoja
Usuario.hasMany(UsuarioLoja, {
  foreignKey: "usuarioId",
  as: "permissoesLojas",
});
Loja.hasMany(UsuarioLoja, { foreignKey: "lojaId", as: "permissoesUsuarios" });
UsuarioLoja.belongsTo(Usuario, { foreignKey: "usuarioId" });
UsuarioLoja.belongsTo(Loja, { foreignKey: "lojaId" });

// Loja <-> Produtos (Estoque - many-to-many)
Loja.belongsToMany(Produto, {
  through: EstoqueLoja,
  foreignKey: "lojaId",
  otherKey: "produtoId",
  as: "estoqueProdutos",
});

Produto.belongsToMany(Loja, {
  through: EstoqueLoja,
  foreignKey: "produtoId",
  otherKey: "lojaId",
  as: "estoqueLoja",
});

// Relacionamento MovimentacaoEstoqueLoja <-> Produto
MovimentacaoEstoqueLoja.hasMany(MovimentacaoEstoqueLojaProduto, {
  foreignKey: "movimentacaoEstoqueLojaId",
  as: "produtosEnviados",
});
MovimentacaoEstoqueLojaProduto.belongsTo(MovimentacaoEstoqueLoja, {
  foreignKey: "movimentacaoEstoqueLojaId",
  as: "movimentacao",
});
MovimentacaoEstoqueLojaProduto.belongsTo(Produto, {
  foreignKey: "produtoId",
  as: "produto",
});
Loja.hasMany(EstoqueLoja, {
  foreignKey: "lojaId",
  as: "estoques",
});
Produto.hasMany(EstoqueLoja, {
  foreignKey: "produtoId",
  as: "estoquesEmLojas",
});
EstoqueLoja.belongsTo(Loja, { foreignKey: "lojaId", as: "loja" });
EstoqueLoja.belongsTo(Produto, { foreignKey: "produtoId", as: "produto" });

// Roteiro -> Usuário (Funcionário)
Roteiro.belongsTo(Usuario, { foreignKey: "funcionarioId", as: "funcionario" });
Usuario.hasMany(Roteiro, { foreignKey: "funcionarioId", as: "roteiros" });

// Roteiro <-> Lojas (many-to-many)
Roteiro.belongsToMany(Loja, {
  through: RoteiroLoja,
  foreignKey: "roteiroId",
  otherKey: "lojaId",
  as: "lojas",
});

Loja.belongsToMany(Roteiro, {
  through: RoteiroLoja,
  foreignKey: "lojaId",
  otherKey: "roteiroId",
  as: "roteiros",
});

// Acesso direto à tabela RoteiroLoja
Roteiro.hasMany(RoteiroLoja, { foreignKey: "roteiroId", as: "roteirosLojas" });
RoteiroLoja.belongsTo(Roteiro, { foreignKey: "roteiroId", as: "roteiro" });
RoteiroLoja.belongsTo(Loja, { foreignKey: "lojaId", as: "loja" });

// Roteiro -> Gastos
Roteiro.hasMany(RoteiroGasto, { foreignKey: "roteiroId", as: "gastos" });
RoteiroGasto.belongsTo(Roteiro, { foreignKey: "roteiroId", as: "roteiro" });

// Roteiro -> Localizacoes em tempo real
Roteiro.hasMany(RoteiroLocalizacao, { foreignKey: "roteiroId", as: "localizacoes" });
RoteiroLocalizacao.belongsTo(Roteiro, { foreignKey: "roteiroId", as: "roteiro" });
Usuario.hasMany(RoteiroLocalizacao, { foreignKey: "usuarioId", as: "localizacoesRoteiros" });
RoteiroLocalizacao.belongsTo(Usuario, { foreignKey: "usuarioId", as: "usuario" });

// Movimentação -> Roteiro
Movimentacao.belongsTo(Roteiro, { foreignKey: "roteiroId", as: "roteiro" });
Roteiro.hasMany(Movimentacao, { foreignKey: "roteiroId", as: "movimentacoes" });

// ComissaoLoja -> Loja
ComissaoLoja.belongsTo(Loja, { foreignKey: "lojaId", as: "loja" });
Loja.hasMany(ComissaoLoja, { foreignKey: "lojaId", as: "comissoes" });

// ComissaoLoja -> Roteiro (opcional)
ComissaoLoja.belongsTo(Roteiro, { foreignKey: "roteiroId", as: "roteiro" });
Roteiro.hasMany(ComissaoLoja, { foreignKey: "roteiroId", as: "comissoes" });

// À Receber por Loja (associações únicas)
AReceberLoja.belongsTo(Loja, { foreignKey: "lojaId", as: "loja" });
AReceberLoja.belongsTo(Roteiro, { foreignKey: "roteiroId", as: "roteiro" });
Loja.hasMany(AReceberLoja, { foreignKey: "lojaId", as: "areceber" });
Roteiro.hasMany(AReceberLoja, { foreignKey: "roteiroId", as: "lojasAReceber" });

// CarrinhoUsuario -> Usuario
CarrinhoUsuario.belongsTo(Usuario, { foreignKey: "usuarioId", as: "usuario" });
Usuario.hasMany(CarrinhoUsuario, { foreignKey: "usuarioId", as: "carrinhos" });

// DevolucaoCarrinho -> CarrinhoUsuario
DevolucaoCarrinho.belongsTo(CarrinhoUsuario, { foreignKey: "carrinhoId", as: "carrinho" });
CarrinhoUsuario.hasMany(DevolucaoCarrinho, { foreignKey: "carrinhoId", as: "devolucoes" });

// DevolucaoCarrinho -> Usuario
DevolucaoCarrinho.belongsTo(Usuario, { foreignKey: "usuarioId", as: "usuario" });
Usuario.hasMany(DevolucaoCarrinho, { foreignKey: "usuarioId", as: "devolucoes" });

// CarrinhoItem -> CarrinhoUsuario
CarrinhoItem.belongsTo(CarrinhoUsuario, { foreignKey: "carrinhoId", as: "carrinho" });
CarrinhoUsuario.hasMany(CarrinhoItem, { foreignKey: "carrinhoId", as: "itens" });

// CarrinhoItem -> Produto
CarrinhoItem.belongsTo(Produto, { foreignKey: "produtoId", as: "produto" });
Produto.hasMany(CarrinhoItem, { foreignKey: "produtoId", as: "carrinhoItens" });

// DevolucaoCarrinhoItem -> DevolucaoCarrinho
DevolucaoCarrinhoItem.belongsTo(DevolucaoCarrinho, { foreignKey: "devolucaoId", as: "devolucao" });
DevolucaoCarrinho.hasMany(DevolucaoCarrinhoItem, { foreignKey: "devolucaoId", as: "itens" });

// DevolucaoCarrinhoItem -> Produto
DevolucaoCarrinhoItem.belongsTo(Produto, { foreignKey: "produtoId", as: "produto" });
Produto.hasMany(DevolucaoCarrinhoItem, { foreignKey: "produtoId", as: "devolucaoItens" });

export {
  Usuario,
  Loja,
  Maquina,
  Produto,
  Movimentacao,
  MovimentacaoProduto,
  CarrinhoItem,
  DevolucaoCarrinhoItem,
  LogAtividade,
  UsuarioLoja,
  EstoqueLoja,
  MovimentacaoEstoqueLoja,
  MovimentacaoEstoqueLojaProduto,
  Roteiro,
  RoteiroLoja,
  RoteiroGasto,
  TemplateRoteiro,
  ComissaoLoja,
  AReceberLoja,
  Veiculo,
  MovimentacaoVeiculo,
  Manutencao,
  CarrinhoUsuario,
  DevolucaoCarrinho,
  RoteiroLocalizacao,
  AlertaResolvido,
  sequelize, // <-- exporta a conexão
};
