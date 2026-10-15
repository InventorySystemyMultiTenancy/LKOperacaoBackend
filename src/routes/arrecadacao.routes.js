import express from "express";
import { autenticar, autorizarPermissao } from "../middlewares/auth.js";
import {
  prepararArrecadacao,
  previaMaquinaArrecadacao,
  criarArrecadacao,
  obterArrecadacao,
  listarArrecadacoes,
} from "../services/arrecadacaoService.js";

const router = express.Router();

router.use(autenticar, autorizarPermissao("movimentacoes", "ADMIN", "FINANCEIRO", "FUNCIONARIO"));

const responder = (res, error, mensagem) => {
  if (error.status) return res.status(error.status).json({ error: error.message });
  console.error(`[Arrecadação] ${mensagem}:`, error);
  return res.status(500).json({ error: mensagem });
};

router.get("/preparar", async (req, res) => {
  try {
    if (!req.query.lojaId) return res.status(400).json({ error: "lojaId é obrigatório" });
    res.json(await prepararArrecadacao(req.query.lojaId));
  } catch (error) {
    responder(res, error, "Erro ao preparar a arrecadação");
  }
});

router.post("/previa-maquina", async (req, res) => {
  try {
    res.json(await previaMaquinaArrecadacao(req.body));
  } catch (error) {
    responder(res, error, "Erro ao calcular a máquina");
  }
});

router.get("/", async (req, res) => {
  try {
    res.json(await listarArrecadacoes(req.query));
  } catch (error) {
    responder(res, error, "Erro ao listar arrecadações");
  }
});

router.get("/:id", async (req, res) => {
  try {
    res.json(await obterArrecadacao(req.params.id));
  } catch (error) {
    responder(res, error, "Erro ao buscar a arrecadação");
  }
});

router.post("/", async (req, res) => {
  try {
    const arrecadacao = await criarArrecadacao({ usuario: req.usuario, dados: req.body });
    res.status(201).json(arrecadacao);
  } catch (error) {
    responder(res, error, "Erro ao salvar a arrecadação");
  }
});

export default router;
