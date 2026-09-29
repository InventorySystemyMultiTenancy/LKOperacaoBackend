import express from "express";
import {
  listarUsuarios,
  obterUsuario,
  criarUsuario,
  atualizarUsuario,
  deletarUsuario,
  reativarUsuario,
  listarFuncionarios,
} from "../controllers/usuarioController.js";
import {
  autenticar,
  autorizarRole,
  autorizarAdminOuEmailAutorizado,
  registrarLog,
} from "../middlewares/auth.js";
import { cacheGet, clearHttpCacheOnSuccess } from "../middlewares/httpCache.js";

const router = express.Router();

// Rota pública para listar funcionários (usada em dropdowns)
router.get("/funcionarios", autenticar, cacheGet({ ttlSeconds: 60 }), listarFuncionarios);

// Rota para listar todos os usuários (ADMIN ou emails autorizados)
router.get(
  "/",
  autenticar,
  autorizarAdminOuEmailAutorizado,
  cacheGet({ ttlSeconds: 20 }),
  listarUsuarios
);

// Rota para obter usuário por ID (ADMIN ou emails autorizados)
router.get("/:id", autenticar, autorizarAdminOuEmailAutorizado, obterUsuario);

// Todas as outras rotas requerem autenticação e role ADMIN
router.use(autenticar, autorizarRole("ADMIN"));
router.post("/", clearHttpCacheOnSuccess(), registrarLog("CRIAR_USUARIO", "Usuario"), criarUsuario);
router.put(
  "/:id",
  clearHttpCacheOnSuccess(),
  registrarLog("EDITAR_USUARIO", "Usuario"),
  atualizarUsuario
);
router.delete(
  "/:id",
  clearHttpCacheOnSuccess(),
  registrarLog("DELETAR_USUARIO", "Usuario"),
  deletarUsuario
);
router.patch(
  "/:id/reativar",
  clearHttpCacheOnSuccess(),
  registrarLog("REATIVAR_USUARIO", "Usuario"),
  reativarUsuario
);

export default router;
