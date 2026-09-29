⚠️ **AÇÃO URGENTE - RESOLVER ERRO EM PRODUÇÃO**

## Erro Atual

```
error: column Loja.movimentacao_em_andamento does not exist
```

## ✅ Solução Rápida

### Passo 1: Conectar ao banco de produção no DBeaver

Use as credenciais de conexão do Render.

### Passo 2: Executar o SQL

Abra o arquivo `MIGRATION_BLOQUEIO_LOJAS.sql` e execute todo o conteúdo.

OU copie e cole este SQL:

```sql
ALTER TABLE lojas ADD COLUMN IF NOT EXISTS movimentacao_em_andamento BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE lojas ADD COLUMN IF NOT EXISTS usuario_em_movimentacao_id UUID;
ALTER TABLE lojas ADD COLUMN IF NOT EXISTS data_inicio_movimentacao TIMESTAMP;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lojas_usuario_em_movimentacao_id_fkey') THEN
        ALTER TABLE lojas ADD CONSTRAINT lojas_usuario_em_movimentacao_id_fkey 
        FOREIGN KEY (usuario_em_movimentacao_id) REFERENCES usuarios(id) ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

UPDATE lojas SET movimentacao_em_andamento = false, usuario_em_movimentacao_id = NULL, data_inicio_movimentacao = NULL;
```

### Passo 3: Verificar

Execute esta query para confirmar:

```sql
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'lojas' 
  AND column_name LIKE '%movimentacao%';
```

Você deve ver 3 colunas.

### Passo 4: Restart da aplicação no Render

No painel do Render, clique em "Manual Deploy" > "Clear build cache & deploy" (ou apenas restart).

## ⏱️ Tempo estimado: 5 minutos

---

**Arquivos importantes:**
- SQL completo: `MIGRATION_BLOQUEIO_LOJAS.sql`
- Documentação: `BLOQUEIO_LOJAS_DOCUMENTACAO.md`
