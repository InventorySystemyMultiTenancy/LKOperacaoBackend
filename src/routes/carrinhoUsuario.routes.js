import express from "express";
import {
  criarCarrinho,
  listarCarrinhos,
  buscarCarrinhoAtual,
  atualizarCarrinho,
  registrarDevolucao,
  registrarDevolucaoPorAdmin,
  listarAlertasDiscrepancia,
  desativarAlerta,
  getStatusCarrinho,
  listarHistoricoDevolucoes,
} from "../controllers/carrinhoUsuarioController.js";
import { autenticar, autorizarAdminOuEmailAutorizado } from "../middlewares/auth.js";

const router = express.Router();

// ============================================
// ROTAS ADMIN OU EMAILS AUTORIZADOS (eriky e gerson)
// ============================================

// Criar carrinho para usuário (Admin ou emails autorizados)
router.post("/", autenticar, autorizarAdminOuEmailAutorizado, criarCarrinho);

// Listar todos os carrinhos (Admin ou emails autorizados - com filtros opcionais)
router.get("/", autenticar, autorizarAdminOuEmailAutorizado, listarCarrinhos);

// Atualizar carrinho (Admin ou emails autorizados)
router.put("/:id", autenticar, autorizarAdminOuEmailAutorizado, atualizarCarrinho);

// Listar alertas de discrepância (Admin ou emails autorizados)
router.get("/alertas", autenticar, autorizarAdminOuEmailAutorizado, listarAlertasDiscrepancia);

// Desativar alerta (Admin ou emails autorizados)
router.put("/alertas/:id/desativar", autenticar, autorizarAdminOuEmailAutorizado, desativarAlerta);

// Listar histórico completo de devoluções com filtros (Admin ou emails autorizados)
router.get("/devolucoes", autenticar, autorizarAdminOuEmailAutorizado, listarHistoricoDevolucoes);

// Registrar devolução em nome de funcionário (Admin ou emails autorizados)
router.post("/devolucao-admin", autenticar, autorizarAdminOuEmailAutorizado, registrarDevolucaoPorAdmin);

// ============================================
// ROTAS USUARIO
// ============================================

// Buscar carrinho ativo do usuário logado
router.get("/meu-carrinho", autenticar, buscarCarrinhoAtual);

// Status do carrinho para dashboard
router.get("/status", autenticar, getStatusCarrinho);

// Registrar devolução de produtos
router.post("/devolucao", autenticar, registrarDevolucao);

// ============================================
// ROTAS PÚBLICAS (com autenticação)
// ============================================

// Buscar carrinho de um usuário específico (por ID)
router.get("/:usuarioId", autenticar, buscarCarrinhoAtual);

export default router;
