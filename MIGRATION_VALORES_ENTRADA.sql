-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION - ADICIONAR CAMPOS DE VALORES DE ENTRADA
-- Adiciona campos para registrar valores de entrada na movimentação
-- ═══════════════════════════════════════════════════════════════════

-- Adicionar colunas de valores de entrada na tabela movimentacoes
ALTER TABLE movimentacoes 
ADD COLUMN IF NOT EXISTS valor_entrada_fichas DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS valor_entrada_notas DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS valor_entrada_cartao DECIMAL(10,2);

-- Adicionar comentários nas colunas
COMMENT ON COLUMN movimentacoes.valor_entrada_fichas IS 'Valor total de fichas coletadas (R$)';
COMMENT ON COLUMN movimentacoes.valor_entrada_notas IS 'Valor total de notas inseridas na máquina (R$)';
COMMENT ON COLUMN movimentacoes.valor_entrada_cartao IS 'Valor de pagamento digital - cartão/pix (R$)';

-- Criar índices para melhor performance em consultas
CREATE INDEX IF NOT EXISTS idx_movimentacoes_valor_entrada_fichas ON movimentacoes(valor_entrada_fichas);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_valor_entrada_notas ON movimentacoes(valor_entrada_notas);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_valor_entrada_cartao ON movimentacoes(valor_entrada_cartao);

-- ═══════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO
-- ═══════════════════════════════════════════════════════════════════

-- Verificar se as colunas foram criadas
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  COALESCE(col_description('movimentacoes'::regclass, ordinal_position), '') as description
FROM information_schema.columns
WHERE table_name = 'movimentacoes'
  AND column_name IN ('valor_entrada_fichas', 'valor_entrada_notas', 'valor_entrada_cartao')
ORDER BY column_name;

-- ═══════════════════════════════════════════════════════════════════
-- RESULTADO ESPERADO
-- ═══════════════════════════════════════════════════════════════════

SELECT 
  '✅ Migration concluída!' as status,
  '3 novas colunas adicionadas na tabela movimentacoes' as resultado,
  'Agora os valores de entrada são registrados na movimentação, não na máquina' as observacao;
