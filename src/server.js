import express from "express";
import "./jobs/index.js";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { sequelize } from "./database/connection.js";
import routes from "./routes/index.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false, // Permitir recursos inline para a página de relatório
  }),
);

// Configurar CORS para aceitar localhost e produção
// FRONTEND_URL aceita mais de um endereço separado por vírgula; barra no
// final é ignorada (https://site.vercel.app/ == https://site.vercel.app).
const normalizarOrigem = (url) => String(url || "").trim().replace(/\/+$/, "");
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:5174",
  "https://toydiversoes.selfmachine.com.br",
  ...String(process.env.FRONTEND_URL || "").split(","),
]
  .map(normalizarOrigem)
  .filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Permitir requisições sem origin (como mobile apps, Postman, curl)
      if (!origin) return callback(null, true);

      // Se estiver na lista de origens permitidas ou for "*"
      if (allowedOrigins.includes(normalizarOrigem(origin)) || allowedOrigins.includes("*")) {
        callback(null, true);
      } else {
        console.warn(
          `[CORS] Origem recusada: ${origin} — adicione em FRONTEND_URL (separe vários por vírgula).`,
        );
        callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    // X-Link-Token: token dos vouchers (rotas públicas /api/credito-remoto/publico)
    allowedHeaders: ["Content-Type", "Authorization", "X-Link-Token"],
  }),
);
app.use(morgan("dev"));
// Limite maior para as fotos de relógio (leitura por foto)
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos da pasta public
app.use("/public", express.static(path.join(__dirname, "..", "public")));

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Camaleão Diversões API",
    version: "1.0.0",
    status: "online",
    endpoints: {
      health: "/health",
      auth: "/api/auth",
      usuarios: "/api/usuarios",
      lojas: "/api/lojas",
      maquinas: "/api/maquinas",
      produtos: "/api/produtos",
      movimentacoes: "/api/movimentacoes",
      relatorios: "/api/relatorios",
    },
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Debug endpoint - remover em produção
app.get("/debug/admin", async (req, res) => {
  const { Usuario } = await import("./models/index.js");
  const admin = await Usuario.findOne({
    where: { email: process.env.ADMIN_EMAIL || "admin@toydiversoes.com" },
  });
  res.json({
    adminExists: !!admin,
    email: admin?.email,
    role: admin?.role,
    ativo: admin?.ativo,
  });
});

// Routes
app.use("/api", routes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || "Erro interno do servidor",
      status: err.status || 500,
    },
  });
});

// Database connection and server start
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexão com PostgreSQL estabelecida com sucesso!");

    // Sync database - cria novas tabelas/colunas mas não altera existentes
    // Para evitar erros de sintaxe SQL ao adicionar constraints
    await sequelize.sync();
    console.log("✅ Database sincronizado!");

    // sync() não adiciona colunas em tabelas existentes
    await sequelize.query(
      `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS permissoes JSONB DEFAULT NULL;`
    );

    // Barreira final dos vouchers: o próprio Postgres recusa qualquer
    // gravação em que o valor usado passe do limite.
    await sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'check_credito_remoto_limite'
        ) THEN
          ALTER TABLE credito_remoto_links
            ADD CONSTRAINT check_credito_remoto_limite
            CHECK (usado_centavos >= 0 AND usado_centavos <= limite_centavos AND limite_centavos > 0);
        END IF;
      END $$;
    `);

    // sync() não adiciona colunas em tabelas existentes
    await sequelize.query(
      "ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS horario_funcionamento JSONB",
    );
    // Máquinas já cadastradas entram como CAPITAL
    await sequelize.query(
      "ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS regiao VARCHAR(10) NOT NULL DEFAULT 'CAPITAL'",
    );
    // Leitores sem vínculo: a tabela também guarda a região, e o horário pode ficar vazio
    await sequelize.query(
      "ALTER TABLE machine_pay_horarios ADD COLUMN IF NOT EXISTS regiao VARCHAR(10)",
    );
    await sequelize.query(
      "ALTER TABLE machine_pay_horarios ALTER COLUMN horario_funcionamento DROP NOT NULL",
    );

    // Conferência por leitura de relógio (Camaleão Diversões)
    await sequelize.query(
      "ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS valor_pulso DECIMAL(10,2) NOT NULL DEFAULT 1",
    );
    await sequelize.query(
      "ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS valor_jogada DECIMAL(10,2)",
    );
    await sequelize.query(
      "ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS jogadas_por_premio INTEGER",
    );
    await sequelize.query(
      "ALTER TABLE movimentacoes ADD COLUMN IF NOT EXISTS conferencia JSONB",
    );
    await sequelize.query(
      "ALTER TABLE movimentacoes ADD COLUMN IF NOT EXISTS nivel_conferencia VARCHAR(10)",
    );
    await sequelize.query(
      "ALTER TABLE movimentacoes ADD COLUMN IF NOT EXISTS leitura_foto JSONB",
    );

    // Roteiros: categoria e reinício configuráveis
    await sequelize.query(
      "ALTER TABLE roteiros ADD COLUMN IF NOT EXISTS categoria VARCHAR(50)",
    );
    await sequelize.query(
      "ALTER TABLE roteiros ADD COLUMN IF NOT EXISTS reinicio JSONB",
    );
    await sequelize.query(
      "ALTER TABLE roteiros ADD COLUMN IF NOT EXISTS ultimo_reinicio TIMESTAMP WITH TIME ZONE",
    );
    // Excluir roteiro mantém os valores a receber das lojas
    await sequelize.query(
      "ALTER TABLE areceber_lojas ALTER COLUMN roteiro_id DROP NOT NULL",
    );
    // Remove os roteiros "Bolinha N" criados automaticamente (sem categoria)
    {
      const { removerBolinhasAutomaticas } = await import("./services/roteiroGestaoService.js");
      await removerBolinhasAutomaticas();
    }

    // Comissão do ponto (Controle de Arrecadação)
    await sequelize.query(
      "ALTER TABLE lojas ADD COLUMN IF NOT EXISTS percentual_comissao DECIMAL(5,2) NOT NULL DEFAULT 0",
    );

    // Criar admin padrão se não existir
    const { Usuario } = await import("./models/index.js");
    const adminEmail = process.env.ADMIN_EMAIL || "admin@toydiversoes.com";
    const adminExistente = await Usuario.findOne({
      where: { email: adminEmail },
    });

    if (!adminExistente) {
      const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";
      await Usuario.create({
        nome: "Administrador",
        email: adminEmail,
        senha: adminPassword,
        role: "ADMIN",
        telefone: "(11) 99999-9999",
        ativo: true,
      });
      console.log("✅ Usuário admin criado:", adminEmail);
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📍 http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);

      // Agendar limpeza automática de dados antigos (diariamente às 3h da manhã)
      if (process.env.NODE_ENV === "production") {
        iniciarLimpezaAutomatica();
      }
    });
  } catch (error) {
    console.error("❌ Erro ao conectar com o banco de dados:", error);
    process.exit(1);
  }
};

// Função para executar limpeza automática diariamente
const iniciarLimpezaAutomatica = async () => {
  const { limparDadosAntigos } = await import("./utils/dataRetention.js");

  const executarLimpeza = async () => {
    const agora = new Date();
    const horas = agora.getHours();

    // Executar apenas às 3h da manhã
    if (horas === 3) {
      console.log("🗑️  Executando limpeza automática de dados antigos...");
      try {
        await limparDadosAntigos();
      } catch (error) {
        console.error("❌ Erro na limpeza automática:", error);
      }
    }
  };

  // Executar a cada 1 hora para verificar se é 3h da manhã
  setInterval(executarLimpeza, 60 * 60 * 1000); // 1 hora em ms
  console.log("⏰ Limpeza automática agendada para 3h da manhã (diariamente)");
};

startServer();

export default app;
