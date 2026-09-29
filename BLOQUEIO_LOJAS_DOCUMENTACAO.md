# Bloqueio de Movimentações por Loja (Por Roteiro)

## 📋 Descrição

Implementado sistema de bloqueio que impede fazer movimentações em máquinas de diferentes lojas **dentro do mesmo roteiro**. 

**Funcionamento:**
1. Quando uma movimentação é feita em uma máquina de uma loja **com roteiroId**, essa loja fica "bloqueada" para aquele roteiro
2. Não é possível fazer movimentações em máquinas de **outras lojas do mesmo roteiro** enquanto a primeira não for concluída
3. Ao clicar em "Concluir Loja", o bloqueio é liberado e é possível iniciar movimentações em outra loja do roteiro
4. **Movimentações sem roteiroId não são bloqueadas** (funcionam normalmente)
5. **Lojas de roteiros diferentes não se bloqueiam entre si**

## 🔧 Alterações Realizadas

### 1. Modelo de Dados (`src/models/Loja.js`)

Adicionados 3 novos campos na tabela `lojas`:

- **movimentacao_em_andamento** (BOOLEAN): Indica se há movimentação em andamento na loja
- **usuario_em_movimentacao_id** (UUID): ID do usuário que está fazendo a movimentação
- **data_inicio_movimentacao** (DATE): Data/hora em que a movimentação foi iniciada

### 2. Controller de Movimentações (`src/controllers/movimentacaoController.js`)

Modificada a função `registrarMovimentacao` para:

- **APENAS SE `roteiroId` FOR FORNECIDO:**
  - Buscar todas as lojas que fazem parte deste roteiro específico
  - Verificar se há outra loja deste roteiro com movimentação em andamento
  - Bloquear a operação se houver outra loja em uso no mesmo roteiro
  - Marcar a loja atual como "em andamento" na primeira movimentação
- **SE NÃO HOUVER `roteiroId`:** movimentação funciona normalmente (sem bloqueio)
- **Roteiros diferentes não se bloqueiam entre si**

**Mensagem de erro retornada:**
```json
{
  "error": "Não é possível fazer movimentação em outra loja",
  "message": "A loja 'Nome da Loja' está com movimentação em andamento neste roteiro. Por favor, conclua a loja atual antes de iniciar movimentações em outra loja.",
  "lojaEmUso": {
    "id": "uuid-da-loja",
    "nome": "Nome da Loja"
  }
}
```

### 3. Controller de Roteiros (`src/controllers/roteiroController.js`)

Modificada a função `concluirLoja` para:

- Liberar o bloqueio da loja ao concluí-la
- Resetar os campos de controle (movimentacao_em_andamento, usuario_em_movimentacao_id, data_inicio_movimentacao)

### 4. Migration

Criada migration `20260310-add-controle-movimentacao-lojas.js` para adicionar os campos no banco de dados.

## 🚀 Como Executar a Migration

### Opção 1: Script Node.js (Desenvolvimento Local)

```bash
node run-migration-bloqueio-lojas.js
```

### Opção 2: SQL Direto no DBeaver/pgAdmin (PRODUÇÃO - RECOMENDADO)

⚠️ **IMPORTANTE: Execute este SQL no banco de produção (Render)**

Abra o arquivo `MIGRATION_BLOQUEIO_LOJAS.sql` no DBeaver e execute-o, OU copie e cole o SQL abaixo:

```sql
-- 1. Adicionar coluna movimentacao_em_andamento
ALTER TABLE lojas 
ADD COLUMN IF NOT EXISTS movimentacao_em_andamento BOOLEAN NOT NULL DEFAULT false;

-- 2. Adicionar coluna usuario_em_movimentacao_id
ALTER TABLE lojas 
ADD COLUMN IF NOT EXISTS usuario_em_movimentacao_id UUID;

-- 3. Adicionar coluna data_inicio_movimentacao
ALTER TABLE lojas 
ADD COLUMN IF NOT EXISTS data_inicio_movimentacao TIMESTAMP;

-- 4. Adicionar foreign key
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'lojas_usuario_em_movimentacao_id_fkey'
    ) THEN
        ALTER TABLE lojas 
        ADD CONSTRAINT lojas_usuario_em_movimentacao_id_fkey 
        FOREIGN KEY (usuario_em_movimentacao_id) 
        REFERENCES usuarios(id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE;
    END IF;
END $$;

-- 5. Adicionar comentários
COMMENT ON COLUMN lojas.movimentacao_em_andamento IS 'Indica se há uma movimentação em andamento nesta loja';
COMMENT ON COLUMN lojas.usuario_em_movimentacao_id IS 'ID do usuário que está fazendo movimentação nesta loja';
COMMENT ON COLUMN lojas.data_inicio_movimentacao IS 'Data/hora em que a movimentação foi iniciada';

-- 6. Resetar valores iniciais
UPDATE lojas 
SET movimentacao_em_andamento = false,
    usuario_em_movimentacao_id = NULL,
    data_inicio_movimentacao = NULL;

-- 7. Verificar se funcionou
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'lojas' 
  AND column_name IN ('movimentacao_em_andamento', 'usuario_em_movimentacao_id', 'data_inicio_movimentacao');
```

### ✅ Verificação

Após executar, você deve ver 3 linhas no resultado da query de verificação:
- `movimentacao_em_andamento` (boolean, not null, default: false)
- `usuario_em_movimentacao_id` (uuid, nullable)
- `data_inicio_movimentacao` (timestamp, nullable)

## 📝 Exemplo de Uso

### Cenário 1: Primeira movimentação (com roteiro)

```
1. Usuário faz movimentação na máquina M1 da Loja A (Roteiro R1)
   → Sistema marca Loja A como "em andamento"
   → Movimentação é registrada com sucesso
```

### Cenário 2: Tentativa de movimentação em outra loja DO MESMO ROTEIRO

```
2. Usuário tenta fazer movimentação na máquina M5 da Loja B (Roteiro R1) sem concluir Loja A
   → Sistema detecta que Loja A está em andamento NO ROTEIRO R1
   → Sistema retorna erro: "A loja 'Loja A' está com movimentação em andamento neste roteiro..."
   → Movimentação é bloqueada
```

### Cenário 3: Movimentação em loja de OUTRO ROTEIRO (permitido)

```
3. Usuário faz movimentação na máquina M10 da Loja C (Roteiro R2)
   → Sistema verifica apenas lojas do Roteiro R2
   → Loja A está em uso no Roteiro R1, mas NÃO bloqueia o Roteiro R2
   → Movimentação é registrada com sucesso
```

### Cenário 4: Concluir loja e liberar bloqueio

```
4. Usuário clica em "Concluir Loja" na Loja A (Roteiro R1)
   → Sistema libera o bloqueio da Loja A
   → Agora é possível fazer movimentações em outras lojas do Roteiro R1
```

### Cenário 5: Movimentação sem roteiro (sempre permitida)

```
5. Usuário faz movimentação avulsa na máquina M20 da Loja D (sem roteiroId)
   → Sistema NÃO aplica bloqueio
   → Movimentação é registrada com sucesso
```

## ⚠️ Observações

- O bloqueio é aplicado por **LOJA dentro de um ROTEIRO específico**
- Múltiplas movimentações podem ser feitas em máquinas da MESMA loja
- **Roteiros diferentes NÃO se bloqueiam entre si**
- **Movimentações sem `roteiroId` NÃO são bloqueadas**
- O bloqueio persiste mesmo se o usuário fechar o aplicativo (armazenado no banco)
- Administradores podem resetar manualmente o campo `movimentacao_em_andamento` no banco se necessário

## 🔍 Logs do Sistema

O sistema gera logs para acompanhar o bloqueio/desbloqueio:

```
🔒 Loja "Nome da Loja" bloqueada para movimentações de outras lojas
🔓 Loja "Nome da Loja" liberada para movimentações
```

## 🛠️ Troubleshooting

### Problema: Loja ficou bloqueada permanentemente

**Solução:** Execute o seguinte SQL no banco:

```sql
UPDATE lojas 
SET movimentacao_em_andamento = false,
    usuario_em_movimentacao_id = NULL,
    data_inicio_movimentacao = NULL
WHERE id = 'uuid-da-loja';
```

### Problema: Usuário não consegue fazer movimentação em nenhuma loja

**Solução:** Verifique se há alguma loja com `movimentacao_em_andamento = true` e redefina:

```sql
-- Ver lojas bloqueadas
SELECT id, nome, movimentacao_em_andamento, data_inicio_movimentacao 
FROM lojas 
WHERE movimentacao_em_andamento = true;

-- Resetar todas as lojas
UPDATE lojas 
SET movimentacao_em_andamento = false,
    usuario_em_movimentacao_id = NULL,
    data_inicio_movimentacao = NULL;
```

## 📊 Diagrama de Fluxo

```
┌─────────────────────────────────────────────┐
│  Usuário tenta registrar movimentação       │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │ Buscar máquina │
         └────────┬───────┘
                  │
                  ▼
         ┌────────────────┐
         │ Buscar loja    │
         └────────┬───────┘
                  │
                  ▼
    ┌─────────────────────────────┐
    │ Tem roteiroId?              │
    └─────────┬───────────────────┘
              │
       ┌──────┴──────┐
       │             │
      NÃO           SIM
       │             │
       ▼             ▼
 ┌──────────┐  ┌──────────────────────┐
 │ Permitir │  │ Buscar lojas do      │
 │ sem      │  │ roteiro              │
 │ bloqueio │  └──────────┬───────────┘
 └──────────┘             │
                          ▼
              ┌──────────────────────────┐
              │ Outra loja deste roteiro │
              │ está em andamento?       │
              └──────────┬───────────────┘
                         │
                  ┌──────┴──────┐
                  │             │
                 SIM           NÃO
                  │             │
                  ▼             ▼
            ┌──────────┐  ┌─────────────────┐
            │ BLOQUEAR │  │ Loja em uso?    │
            │ Retornar │  └────────┬────────┘
            │  erro    │           │
            └──────────┘    ┌──────┴──────┐
                            │             │
                           SIM           NÃO
                            │             │
                            ▼             ▼
                     ┌──────────┐  ┌──────────────┐
                     │ Continuar│  │ Marcar loja  │
                     │          │  │ como em uso  │
                     └────┬─────┘  └──────┬───────┘
                          │               │
                          └───────┬───────┘
                                  │
                                  ▼
                       ┌─────────────────────┐
                       │ Registrar           │
                       │ movimentação        │
                       └─────────────────────┘
```

## ✅ Checklist de Implementação

- [x] Adicionar campos no modelo Loja
- [x] Criar migration para banco de dados
- [x] Modificar registrarMovimentacao com validação
- [x] Modificar concluirLoja para liberar bloqueio
- [x] Criar script de execução da migration
- [x] Documentar implementação
- [ ] Executar migration no banco de dados
- [ ] Testar funcionalidade
