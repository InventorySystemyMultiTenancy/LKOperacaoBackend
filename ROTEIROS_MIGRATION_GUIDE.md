# Migration de Roteiros - Guia de Execução

## Visão Geral
Esta migration adiciona a funcionalidade completa de roteiros ao sistema, incluindo:
- Campo `zona` na tabela `lojas`
- Tabelas `roteiros`, `roteiros_lojas` e `roteiros_gastos`
- Campo `roteiro_id` na tabela `movimentacoes`

## Como Executar a Migration

### Opção 1: Executar diretamente via Node
```bash
node src/database/migrations/add-roteiros-tables.js
```

### Opção 2: Importar e executar no código
```javascript
import { addRoteirosTables } from "./src/database/migrations/add-roteiros-tables.js";

await addRoteirosTables();
```

## Verificação

Após executar a migration, verifique se as tabelas foram criadas:

```sql
-- Verificar tabela roteiros
SELECT * FROM roteiros LIMIT 1;

-- Verificar tabela roteiros_lojas
SELECT * FROM roteiros_lojas LIMIT 1;

-- Verificar tabela roteiros_gastos
SELECT * FROM roteiros_gastos LIMIT 1;

-- Verificar campo zona em lojas
SELECT id, nome, zona, cidade, estado FROM lojas LIMIT 5;

-- Verificar campo roteiro_id em movimentacoes
SELECT id, roteiro_id FROM movimentacoes LIMIT 5;
```

## Endpoints Implementados

### 1. GET /api/roteiros
Lista todos os roteiros (filtrar por data atual por padrão)

**Query params:**
- `data` (opcional): filtrar por data específica (formato: YYYY-MM-DD)

**Exemplo:**
```bash
GET /api/roteiros
GET /api/roteiros?data=2026-01-13
```

### 2. POST /api/roteiros/gerar
Gera 6 roteiros diários automáticos agrupando lojas por zona

**Request body:**
```json
{
  "data": "2026-01-13"  // opcional, default: data atual
}
```

**Response:**
```json
{
  "message": "6 roteiros gerados com sucesso para 2026-01-13",
  "roteiros": ["uuid-1", "uuid-2", "uuid-3", "uuid-4", "uuid-5", "uuid-6"]
}
```

### 3. GET /api/roteiros/:id
Busca detalhes completos de um roteiro específico

**Exemplo:**
```bash
GET /api/roteiros/550e8400-e29b-41d4-a716-446655440000
```

### 4. POST /api/roteiros/:id/iniciar
Inicia um roteiro (muda status para 'em_andamento')

**Request body:**
```json
{
  "funcionarioId": "uuid-do-usuario",
  "funcionarioNome": "João Silva"
}
```

### 5. POST /api/roteiros/:roteiroId/lojas/:lojaId/concluir
Marca uma loja como concluída no roteiro

**Exemplo:**
```bash
POST /api/roteiros/550e8400-e29b-41d4-a716-446655440000/lojas/660e8400-e29b-41d4-a716-446655440001/concluir
```

### 6. POST /api/roteiros/:id/concluir
Finaliza o roteiro completo (só permite se todas as lojas estão concluídas)

**Exemplo:**
```bash
POST /api/roteiros/550e8400-e29b-41d4-a716-446655440000/concluir
```

### 7. GET /api/maquinas?lojaId=:id&incluirUltimaMovimentacao=true
Buscar máquinas de uma loja específica com última movimentação

**Query params:**
- `lojaId` (obrigatório): ID da loja
- `incluirUltimaMovimentacao` (opcional): true para incluir última movimentação

**Exemplo:**
```bash
GET /api/maquinas?lojaId=660e8400-e29b-41d4-a716-446655440001&incluirUltimaMovimentacao=true
```

### 8. POST /api/movimentacoes (modificado)
Criar movimentação com roteiro_id

**Request body:**
```json
{
  "maquinaId": "uuid-maquina",
  "roteiroId": "uuid-roteiro",  // ← NOVO CAMPO
  "totalPre": 20,
  "sairam": 5,
  "abastecidas": 30,
  "fichas": 150,
  "contadorIn": 1000,
  "contadorOut": 500,
  "quantidade_notas_entrada": 10,
  "valor_entrada_maquininha_pix": 50.00,
  "observacoes": "Tudo ok"
}
```

## Estrutura das Tabelas

### Tabela: roteiros
```
id                  UUID PRIMARY KEY
data                DATE NOT NULL
zona                VARCHAR(50)        -- 'Norte', 'Sul', 'Leste', 'Oeste', 'Centro'
estado              VARCHAR(2)
cidade              VARCHAR(100)
status              VARCHAR(20)        -- 'pendente', 'em_andamento', 'concluido'
funcionarioId       UUID
funcionarioNome     VARCHAR(100)
totalMaquinas       INT DEFAULT 0
maquinasConcluidas  INT DEFAULT 0
saldoRestante       DECIMAL(10,2) DEFAULT 500.00
createdAt           TIMESTAMP
updatedAt           TIMESTAMP
```

### Tabela: roteiros_lojas
```
id          UUID PRIMARY KEY
roteiro_id  UUID NOT NULL REFERENCES roteiros(id)
loja_id     UUID NOT NULL REFERENCES lojas(id)
concluida   BOOLEAN DEFAULT FALSE
ordem       INT                    -- ordem de visita
createdAt   TIMESTAMP
updatedAt   TIMESTAMP
```

### Tabela: roteiros_gastos
```
id          UUID PRIMARY KEY
roteiro_id  UUID NOT NULL REFERENCES roteiros(id)
categoria   VARCHAR(50)            -- 'Combustível', 'Alimentação', 'Pedágio', etc
valor       DECIMAL(10,2)
descricao   TEXT
createdAt   TIMESTAMP
updatedAt   TIMESTAMP
```

### Campo adicionado em lojas
```
zona        VARCHAR(50)            -- 'Norte', 'Sul', 'Leste', 'Oeste', 'Centro'
```

### Campo adicionado em movimentacoes
```
roteiro_id  UUID REFERENCES roteiros(id)
```

## Fluxo de Uso

1. **Gerar Roteiros Diários:**
   ```bash
   POST /api/roteiros/gerar
   ```

2. **Listar Roteiros do Dia:**
   ```bash
   GET /api/roteiros
   ```

3. **Iniciar um Roteiro:**
   ```bash
   POST /api/roteiros/:id/iniciar
   Body: { "funcionarioId": "...", "funcionarioNome": "João Silva" }
   ```

4. **Ver Detalhes do Roteiro:**
   ```bash
   GET /api/roteiros/:id
   ```

5. **Criar Movimentação (vinculada ao roteiro):**
   ```bash
   POST /api/movimentacoes
   Body: { ..., "roteiroId": "..." }
   ```
   - O sistema automaticamente atualiza `maquinasConcluidas` no roteiro

6. **Concluir Loja:**
   ```bash
   POST /api/roteiros/:roteiroId/lojas/:lojaId/concluir
   ```

7. **Concluir Roteiro:**
   ```bash
   POST /api/roteiros/:id/concluir
   ```

## Observações Importantes

- As lojas precisam ter o campo `zona` preenchido para serem incluídas nos roteiros gerados
- Um roteiro só pode ser concluído se todas as lojas estiverem marcadas como concluídas
- O contador `maquinasConcluidas` é atualizado automaticamente quando uma movimentação com `roteiroId` é criada
- A migration é idempotente: não falha se as tabelas/campos já existirem

## Troubleshooting

### Erro: "Campo zona já existe"
Isso é normal se a migration foi executada anteriormente. A migration ignora erros de campos duplicados.

### Erro: "Não há lojas ativas para gerar roteiros"
Certifique-se de que existem lojas ativas no sistema antes de gerar roteiros.

### Erro: "Ainda existem X lojas pendentes neste roteiro"
Você precisa concluir todas as lojas antes de finalizar o roteiro. Use o endpoint de concluir loja para cada uma.
