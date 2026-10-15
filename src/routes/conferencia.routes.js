import express from "express";
import { Op } from "sequelize";
import { autenticar, autorizarPermissao, autorizarRole } from "../middlewares/auth.js";
import { Movimentacao } from "../models/index.js";
import {
  calcularPreviaConferencia,
  listarConferenciasMaquinas,
  listarHistoricoConferencias,
  atualizarConferenciaMovimentacao,
} from "../services/conferenciaService.js";
import {
  lerRelogioPorFoto,
  leituraPorFotoConfigurada,
  LeituraRelogioError,
} from "../services/leituraRelogioService.js";

const router = express.Router();

const responderErro = (res, error, mensagemPadrao) => {
  if (error instanceof LeituraRelogioError || error.status) {
    return res.status(error.status || 500).json({ error: error.message });
  }
  console.error(`[Conferência] ${mensagemPadrao}:`, error);
  return res.status(500).json({ error: mensagemPadrao });
};

router.get("/status", autenticar, (req, res) => {
  res.json({ leituraPorFoto: leituraPorFotoConfigurada() });
});

// Lê os contadores IN/OUT de 1 a 3 fotos. Usado na tela de coleta por
// qualquer usuário que registra movimentações.
router.post("/leitura-foto", autenticar, async (req, res) => {
  try {
    const { maquinaId, fotos } = req.body;

    let referencia = null;
    if (maquinaId) {
      const ultima = await Movimentacao.findOne({
        where: {
          maquinaId,
          contadorIn: { [Op.ne]: null },
          contadorOut: { [Op.ne]: null },
        },
        order: [["dataColeta", "DESC"]],
        attributes: ["contadorIn", "contadorOut"],
      });
      if (ultima) {
        referencia = { contadorIn: ultima.contadorIn, contadorOut: ultima.contadorOut };
      }
    }

    const leitura = await lerRelogioPorFoto({ fotos, referencia });
    res.json({ ...leitura, referencia });
  } catch (error) {
    responderErro(res, error, "Erro ao ler o relógio pela foto");
  }
});

// Prévia da conferência com os contadores ainda não salvos.
router.post("/previa", autenticar, async (req, res) => {
  try {
    const { maquinaId, contadorIn, contadorOut } = req.body;
    if (!maquinaId) {
      return res.status(400).json({ error: "maquinaId é obrigatório" });
    }
    res.json(await calcularPreviaConferencia({ maquinaId, contadorIn, contadorOut }));
  } catch (error) {
    responderErro(res, error, "Erro ao calcular a prévia da conferência");
  }
});

const acessoPainel = [autenticar, autorizarPermissao("conferencia", "ADMIN", "FINANCEIRO")];

router.get("/", ...acessoPainel, async (req, res) => {
  try {
    res.json(await listarConferenciasMaquinas({ lojaId: req.query.lojaId || null }));
  } catch (error) {
    responderErro(res, error, "Erro ao listar conferências");
  }
});

router.get("/maquinas/:maquinaId", ...acessoPainel, async (req, res) => {
  try {
    res.json(await listarHistoricoConferencias(req.params.maquinaId));
  } catch (error) {
    responderErro(res, error, "Erro ao buscar histórico de conferências");
  }
});

// Recalcula as conferências (ex: depois de mudar a configuração da máquina).
router.post("/recalcular", autenticar, autorizarRole("ADMIN"), async (req, res) => {
  try {
    const { maquinaId } = req.body;
    const movimentacoes = await Movimentacao.findAll({
      where: {
        ...(maquinaId ? { maquinaId } : {}),
        contadorIn: { [Op.ne]: null },
        contadorOut: { [Op.ne]: null },
      },
      attributes: ["id"],
      order: [["dataColeta", "ASC"]],
    });
    for (const mov of movimentacoes) {
      await atualizarConferenciaMovimentacao(mov.id);
    }
    res.json({ recalculadas: movimentacoes.length });
  } catch (error) {
    responderErro(res, error, "Erro ao recalcular conferências");
  }
});

export default router;
