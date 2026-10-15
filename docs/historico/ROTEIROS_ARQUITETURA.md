# 🏗️ Arquitetura do Sistema de Roteiros

## 📊 Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────────┤
│  SelecionarRoteiro.jsx  │  ExecutarRoteiro.jsx  │  Dashboard    │
└────────────┬────────────────────┬───────────────────────────────┘
             │                    │
             │ HTTP/JSON (JWT)    │
             ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Node.js/Express)                   │
├─────────────────────────────────────────────────────────────────┤
│                         ROUTES LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ /api/roteiros          → roteiroController                │  │
│  │ /api/maquinas          → maquinaController (updated)      │  │
│  │ /api/movimentacoes     → movimentacaoController (updated) │  │
│  └──────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                      CONTROLLER LAYER                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ roteiroController.js:                                     │  │
│  │  • listarRoteiros()                                       │  │
│  │  • gerarRoteiros()    ← Lógica de distribuição por zona  │  │
│  │  • obterRoteiro()                                         │  │
│  │  • iniciarRoteiro()                                       │  │
│  │  • concluirLoja()                                         │  │
│  │  • concluirRoteiro()                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                        MODEL LAYER (Sequelize ORM)               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Roteiro ◄────┬──────► Usuario (funcionario)              │  │
│  │              │                                            │  │
│  │              ├──────► RoteiroLoja ◄─────► Loja           │  │
│  │              │                                            │  │
│  │              ├──────► RoteiroGasto                        │  │
│  │              │                                            │  │
│  │              └──────► Movimentacao ◄─────► Maquina       │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ SQL Queries (Sequelize)
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   DATABASE (PostgreSQL)                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  roteiros   │  │roteiros_lojas│  │roteiros_gastos│          │
│  │             │  │              │  │              │          │
│  │ • id        │  │ • roteiro_id │  │ • roteiro_id │          │
│  │ • data      │  │ • loja_id    │  │ • categoria  │          │
│  │ • zona      │  │ • concluida  │  │ • valor      │          │
│  │ • status    │  │ • ordem      │  │ • descricao  │          │
│  └──────┬──────┘  └──────┬───────┘  └──────────────┘          │
│         │                │                                      │
│         │                │                                      │
│  ┌──────▼────────────────▼──────┐  ┌──────────────┐          │
│  │         lojas                 │  │movimentacoes │          │
│  │ (+ campo zona)                │  │(+ roteiro_id)│          │
│  └───────────────────────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Fluxo de Dados Principal

### 1. Geração de Roteiros (Manhã)
```
┌─────────────┐
│   Admin     │
│  (Frontend) │
└──────┬──────┘
       │ POST /api/roteiros/gerar
       ▼
┌──────────────────────────────┐
│  gerarRoteiros()             │
│  1. Buscar lojas ativas      │────┐
│  2. Agrupar por zona         │    │
│  3. Criar 6 roteiros         │    │
│  4. Associar lojas (ordem)   │    │
│  5. Contar máquinas          │    │
└──────────────────────────────┘    │
       │                             │
       │ INSERT INTO roteiros        │
       │ INSERT INTO roteiros_lojas  │
       │                             │
       ▼                             │
┌─────────────────────────┐         │
│     PostgreSQL          │◄────────┘
│  6 novos roteiros       │
│  Lojas distribuídas     │
└─────────────────────────┘
```

### 2. Execução do Roteiro (Durante o Dia)
```
┌──────────────┐
│ Funcionário  │
│  (Frontend)  │
└──────┬───────┘
       │
       │ 1. GET /api/roteiros (listar do dia)
       ▼
┌──────────────────────────┐
│ Escolhe um roteiro       │
└──────┬───────────────────┘
       │
       │ 2. POST /api/roteiros/:id/iniciar
       ▼
┌──────────────────────────────────┐
│ Roteiro status = 'em_andamento'  │
│ funcionarioNome = "João Silva"   │
└──────┬───────────────────────────┘
       │
       │ 3. GET /api/roteiros/:id (ver lojas e máquinas)
       ▼
┌──────────────────────────────────┐
│ Para cada loja no roteiro:       │
│ ┌──────────────────────────────┐ │
│ │ Para cada máquina da loja:   │ │
│ │ ┌──────────────────────────┐ │ │
│ │ │ Coletar dados            │ │ │
│ │ │ POST /api/movimentacoes  │ │ │
│ │ │ (com roteiroId)          │ │ │
│ │ └────────┬─────────────────┘ │ │
│ │          │                   │ │
│ │          │ Auto-atualiza     │ │
│ │          │ maquinasConcluidas│ │
│ │          ▼                   │ │
│ │ ┌──────────────────────────┐ │ │
│ │ │ DB: UPDATE roteiros      │ │ │
│ │ │ SET maquinasConcluidas++ │ │ │
│ │ └──────────────────────────┘ │ │
│ └──────────────────────────────┘ │
│                                  │
│ POST /api/roteiros/:rId/lojas/:lId/concluir
│                                  │
│ UPDATE roteiros_lojas            │
│ SET concluida = true             │
└──────┬───────────────────────────┘
       │
       │ Se todas lojas concluídas:
       │ Auto-atualiza status = 'concluido'
       ▼
┌──────────────────────────┐
│ Roteiro finalizado       │
└──────────────────────────┘
```

## 🗂️ Estrutura de Pastas

```
ClubeKids1FirstClient/
│
├── src/
│   ├── models/
│   │   ├── Roteiro.js              ← NOVO
│   │   ├── RoteiroLoja.js          ← NOVO
│   │   ├── RoteiroGasto.js         ← NOVO
│   │   ├── Loja.js                 ← ATUALIZADO (+ zona)
│   │   ├── Movimentacao.js         ← ATUALIZADO (+ roteiroId)
│   │   └── index.js                ← ATUALIZADO (relacionamentos)
│   │
│   ├── controllers/
│   │   ├── roteiroController.js    ← NOVO
│   │   ├── maquinaController.js    ← ATUALIZADO
│   │   └── movimentacaoController.js ← ATUALIZADO
│   │
│   ├── routes/
│   │   ├── roteiro.routes.js       ← NOVO
│   │   └── index.js                ← ATUALIZADO
│   │
│   └── database/
│       └── migrations/
│           └── add-roteiros-tables.js ← NOVO
│
├── run-migration-roteiros.js       ← NOVO
├── migration-roteiros.sql          ← NOVO
├── test-roteiros-endpoints.js      ← NOVO
├── seed-roteiros-test-data.sql     ← NOVO
│
└── docs/
    ├── ROTEIROS_MIGRATION_GUIDE.md      ← NOVO
    ├── ROTEIROS_IMPLEMENTACAO.md        ← NOVO
    ├── ROTEIROS_EXEMPLOS_API.md         ← NOVO
    ├── ROTEIROS_CHECKLIST.md            ← NOVO
    └── ROTEIROS_ARQUITETURA.md          ← ESTE ARQUIVO
```

## 🔗 Relacionamentos do Banco de Dados

```
┌─────────────┐
│   Usuario   │
│             │
│ • id        │
│ • nome      │
└──────┬──────┘
       │ 1
       │ funcionarioId
       │ N
┌──────▼──────────────┐
│      Roteiro        │
│                     │
│ • id                │◄────────────┐
│ • data              │             │
│ • zona              │             │ roteiro_id
│ • status            │             │
│ • funcionarioId     │       ┌─────┴──────────┐
│ • totalMaquinas     │       │ RoteiroGasto   │
│ • maquinasConcluidas│       │                │
└──────┬──────────────┘       │ • categoria    │
       │ 1                    │ • valor        │
       │                      │ • descricao    │
       │ roteiro_id           └────────────────┘
       │ N
┌──────▼──────────┐
│  RoteiroLoja    │
│                 │
│ • roteiro_id    │
│ • loja_id       │◄─────────┐
│ • concluida     │          │
│ • ordem         │          │ N
└─────────────────┘          │
                             │
                    ┌────────┴────────┐
                    │      Loja       │
                    │                 │
                    │ • id            │
                    │ • nome          │
                    │ • zona  ← NOVO  │
                    │ • cidade        │
                    │ • estado        │
                    └────────┬────────┘
                             │ 1
                             │ lojaId
                             │ N
                    ┌────────▼────────┐
                    │    Maquina      │
                    │                 │
                    │ • id            │
                    │ • codigo        │
                    │ • lojaId        │
                    └────────┬────────┘
                             │ 1
                             │ maquinaId
                             │ N
                    ┌────────▼──────────────┐
                    │   Movimentacao        │
                    │                       │
                    │ • id                  │
                    │ • maquinaId           │
                    │ • roteiroId  ← NOVO   │
                    │ • totalPre            │
                    │ • sairam              │
                    │ • abastecidas         │
                    │ • fichas              │
                    └───────────────────────┘
```

## 🎯 Lógica de Negócio

### Geração Automática de Roteiros
1. Busca todas as lojas ativas
2. Agrupa por zona (Norte, Sul, Leste, Oeste, Centro, Sem_Zona)
3. Cria até 6 roteiros distribuindo as lojas
4. Para cada roteiro:
   - Define zona predominante
   - Associa lojas com ordem de visita
   - Conta total de máquinas ativas
   - Define saldo inicial (R$ 500,00)

### Atualização Automática de Contadores
- Quando uma movimentação é criada com `roteiroId`:
  - Sistema conta quantas máquinas únicas têm movimentação
  - Atualiza campo `maquinasConcluidas` do roteiro
  - Frontend pode exibir progresso: "7 de 15 máquinas"

### Conclusão de Roteiro
- Loja é marcada como concluída manualmente
- Sistema verifica se todas as lojas estão concluídas
- Se sim, status do roteiro muda automaticamente para "concluido"

## 📈 Métricas e Relatórios

### Dados Disponíveis
```sql
-- Roteiros por status
SELECT status, COUNT(*) FROM roteiros GROUP BY status;

-- Progresso médio dos roteiros em andamento
SELECT 
  AVG(maquinasConcluidas::float / NULLIF(totalMaquinas, 0) * 100) as progresso_medio
FROM roteiros 
WHERE status = 'em_andamento';

-- Zona mais produtiva
SELECT 
  zona, 
  SUM(maquinasConcluidas) as total_concluidas
FROM roteiros 
WHERE data >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY zona
ORDER BY total_concluidas DESC;

-- Tempo médio por roteiro
SELECT 
  AVG(EXTRACT(EPOCH FROM (updatedAt - createdAt))/3600) as horas_media
FROM roteiros 
WHERE status = 'concluido';
```

## 🔐 Segurança

- Todos os endpoints requerem autenticação JWT
- Middleware `authenticateToken` valida token em todas as rotas
- Usuário autenticado está em `req.usuario`
- Logs de atividade podem ser implementados

## 🚀 Performance

### Otimizações Implementadas
- Queries com relacionamentos eager loading (include)
- Uso de `Promise.all()` para queries paralelas
- Contadores pré-calculados (evita COUNT em runtime)
- Índices no banco de dados (migration SQL)

### Possíveis Melhorias Futuras
- Cache de roteiros do dia (Redis)
- Paginação na listagem
- WebSocket para atualização em tempo real
- Background job para geração automática diária

---

**Documentação completa do sistema de roteiros**
Versão 1.0 - Janeiro 2026
