import jwt from "jsonwebtoken";
import { Usuario } from "../models/index.js";
import LogAtividade from "../models/LogAtividade.js";
import { temPermissao } from "../utils/permissoes.js";

// US01 - Middleware de Autenticação
export const autenticar = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Token não fornecido" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findByPk(decoded.id);

    if (!usuario || !usuario.ativo) {
      return res
        .status(401)
        .json({ error: "Usuário não encontrado ou inativo" });
    }

    req.usuario = usuario;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
};

// US02 - Middleware de Autorização por Role
// Autenticacao tolerante para trackers em background.
// Sem token/token invalido: ignora a batida para nao acionar logout global no frontend.
export const autenticarOuIgnorar = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token || token === "null" || token === "undefined") {
      return res.status(204).send();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findByPk(decoded.id);

    if (!usuario || !usuario.ativo) {
      return res.status(204).send();
    }

    req.usuario = usuario;
    return next();
  } catch (error) {
    return res.status(204).send();
  }
};

export const autorizarRole = (...rolesPermitidas) => {
  return (req, res, next) => {
    if (!rolesPermitidas.includes(req.usuario.role)) {
      return res.status(403).json({
        error: "Acesso negado. Você não tem permissão para esta ação.",
      });
    }
    next();
  };
};

// Autoriza por permissão personalizada (qualquer uma das `chaves`).
// Usuário sem permissões personalizadas cai nas `rolesLegado`. ADMIN sempre passa.
export const autorizarPermissao = (chaves, ...rolesLegado) => {
  return (req, res, next) => {
    if (!temPermissao(req.usuario, chaves, rolesLegado)) {
      return res.status(403).json({
        error: "Acesso negado. Você não tem permissão para esta ação.",
      });
    }
    next();
  };
};

// US02 - Middleware de Verificação de Permissão em Loja
export const verificarPermissaoLoja = (acao = "visualizar") => {
  return async (req, res, next) => {
    // Permissão irrestrita: todos os usuários têm acesso a todas as lojas
    return next();
  };
};

// US03 - Middleware de Log de Atividades
export const registrarLog = (acao, entidade = null) => {
  return async (req, res, next) => {
    const originalSend = res.send;

    res.send = function (data) {
      res.send = originalSend;

      // Só registra log em caso de sucesso (2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        LogAtividade.create({
          usuarioId: req.usuario?.id,
          acao,
          entidade,
          entidadeId: req.params.id || res.locals.entityId,
          detalhes: {
            method: req.method,
            path: req.path,
            body: req.method !== "GET" ? req.body : undefined,
            params: req.params,
            query: req.query,
          },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get("user-agent"),
        }).catch((err) => console.error("Erro ao criar log:", err));
      }

      return res.send(data);
    };

    next();
  };
};

// Alias para verificar se é ADMIN (convenção)
export const verificarAdmin = autorizarRole("ADMIN");

// Middleware para autorizar ADMIN ou emails específicos autorizados
// Usado para dar permissões de admin a usuários específicos (eriky e gerson)
export const autorizarAdminOuEmailAutorizado = (req, res, next) => {
  const emailsAutorizados = [] // use as permissões personalizadas do usuário;
  
  // Permite se for ADMIN ou se tiver email autorizado
  if (req.usuario.role === "ADMIN" || emailsAutorizados.includes(req.usuario.email)) {
    return next();
  }
  
  return res.status(403).json({
    error: "Acesso negado. Você não tem permissão para esta ação.",
  });
};

// Devolução de carrinho em nome do funcionário: ADMIN, emails autorizados
// ou usuário personalizado com "carrinhos.devolver"
export const autorizarDevolucaoCarrinhos = (req, res, next) => {
  if (Array.isArray(req.usuario.permissoes) && req.usuario.role !== "ADMIN") {
    return autorizarPermissao("carrinhos.devolver")(req, res, next);
  }
  return autorizarAdminOuEmailAutorizado(req, res, next);
};

// Gestão de carrinhos: ADMIN, emails autorizados ou permissão "carrinhos"
export const autorizarCarrinhos = (req, res, next) => {
  if (Array.isArray(req.usuario.permissoes) && req.usuario.role !== "ADMIN") {
    return autorizarPermissao("carrinhos")(req, res, next);
  }
  return autorizarAdminOuEmailAutorizado(req, res, next);
};
