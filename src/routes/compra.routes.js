import express from "express";
import { autenticar, autorizarPermissao } from "../middlewares/auth.js";
import {
  registrarCompra,
  enviarParaLoja,
  excluirCompra,
  obterCompra,
  listarCompras,
  estoqueBase,
  ultimosPrecos,
  listarFornecedores,
  salvarFornecedor,
} from "../services/compraService.js";

const router = express.Router();

// Compras: ADMIN e FINANCEIRO (ou permissão "compras")
router.use(autenticar, autorizarPermissao("compras", "ADMIN", "FINANCEIRO"));

const rota = (fn, mensagem) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    console.error(`[Compras] ${mensagem}:`, error);
    res.status(500).json({ error: mensagem });
  }
};

router.get("/", rota(async (req, res) => res.json(await listarCompras(req.query)), "Erro ao listar compras"));
router.get("/estoque-base", rota(async (req, res) => res.json(await estoqueBase()), "Erro ao carregar o estoque da base"));
router.get("/precos", rota(async (req, res) => res.json(await ultimosPrecos()), "Erro ao carregar os preços"));
router.get("/fornecedores", rota(async (req, res) => res.json(await listarFornecedores()), "Erro ao listar fornecedores"));
router.post(
  "/fornecedores",
  rota(async (req, res) => res.status(201).json(await salvarFornecedor(null, req.body)), "Erro ao salvar fornecedor"),
);
router.put(
  "/fornecedores/:id",
  rota(async (req, res) => res.json(await salvarFornecedor(req.params.id, req.body)), "Erro ao salvar fornecedor"),
);
router.post(
  "/enviar-para-loja",
  rota(
    async (req, res) => res.json(await enviarParaLoja({ usuario: req.usuario, ...req.body })),
    "Erro ao enviar para o ponto",
  ),
);
router.get("/:id", rota(async (req, res) => res.json(await obterCompra(req.params.id)), "Erro ao buscar a compra"));
router.post(
  "/",
  rota(
    async (req, res) => res.status(201).json(await registrarCompra({ usuario: req.usuario, dados: req.body })),
    "Erro ao registrar a compra",
  ),
);
router.delete(
  "/:id",
  rota(async (req, res) => {
    await excluirCompra({ usuario: req.usuario, id: req.params.id });
    res.json({ message: "Compra excluída e estoque desfeito." });
  }, "Erro ao excluir a compra"),
);

export default router;
