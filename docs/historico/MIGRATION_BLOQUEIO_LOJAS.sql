-- ============================================
-- MIGRATION: Adicionar controle de bloqueio de lojas
-- Data: 2026-03-10
-- Descrição: Campos para controlar movimentações em andamento por loja
-- ============================================

-- 1. Adicionar coluna movimentacao_em_andamento
ALTER TABLE lojas 
ADD COLUMN IF NOT EXISTS movimentacao_em_andamento BOOLEAN NOT NULL DEFAULT false;

-- 2. Adicionar coluna usuario_em_movimentacao_id
ALTER TABLE lojas 
ADD COLUMN IF NOT EXISTS usuario_em_movimentacao_id UUID;

-- 3. Adicionar coluna data_inicio_movimentacao
ALTER TABLE lojas 
ADD COLUMN IF NOT EXISTS data_inicio_movimentacao TIMESTAMP;

-- 4. Adicionar constraint de foreign key
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

-- 5. Adicionar comentários nas colunas
COMMENT ON COLUMN lojas.movimentacao_em_andamento IS 'Indica se há uma movimentação em andamento nesta loja';
COMMENT ON COLUMN lojas.usuario_em_movimentacao_id IS 'ID do usuário que está fazendo movimentação nesta loja';
COMMENT ON COLUMN lojas.data_inicio_movimentacao IS 'Data/hora em que a movimentação foi iniciada';

-- 6. Garantir que todas as lojas começam sem bloqueio
UPDATE lojas 
SET movimentacao_em_andamento = false,
    usuario_em_movimentacao_id = NULL,
    data_inicio_movimentacao = NULL
WHERE movimentacao_em_andamento IS NULL OR movimentacao_em_andamento = true;

-- 7. Verificar se as colunas foram criadas corretamente
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_name = 'lojas' 
  AND column_name IN (
      'movimentacao_em_andamento', 
      'usuario_em_movimentacao_id', 
      'data_inicio_movimentacao'
  )
ORDER BY column_name;

-- ============================================
-- FIM DA MIGRATION
-- ============================================
