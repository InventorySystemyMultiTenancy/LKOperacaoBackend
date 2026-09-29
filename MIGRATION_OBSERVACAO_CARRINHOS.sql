-- ============================================
-- MIGRATION: Adicionar campo OBSERVACAO em Carrinhos
-- Data: 2026-03-12
-- Descrição: Adiciona campo observacao nas tabelas carrinho_usuarios e devolucoes_carrinho
-- ============================================

-- BLOCO 1: Adicionar coluna observacao na tabela carrinho_usuarios
ALTER TABLE carrinho_usuarios 
ADD COLUMN IF NOT EXISTS observacao TEXT;

COMMENT ON COLUMN carrinho_usuarios.observacao IS 'Observações sobre o carrinho (ex: "Pedido especial da loja X", "Cliente VIP")';

-- BLOCO 2: Adicionar coluna observacao na tabela devolucoes_carrinho
ALTER TABLE devolucoes_carrinho 
ADD COLUMN IF NOT EXISTS observacao TEXT;

COMMENT ON COLUMN devolucoes_carrinho.observacao IS 'Observações sobre a devolução (ex: "Faltaram produtos da máquina 5", "Sobrou por cancelamento")';

-- BLOCO 3: Verificar se as colunas foram criadas
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('carrinho_usuarios', 'devolucoes_carrinho')
  AND column_name = 'observacao'
ORDER BY table_name;

-- ============================================
-- SUCCESSs
-- ============================================
-- ✅ Se aparecerem 2 linhas (uma para cada tabela), está correto!
