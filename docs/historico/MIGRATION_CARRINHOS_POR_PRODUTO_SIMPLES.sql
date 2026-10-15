-- ============================================
-- MIGRATION SIMPLES: Carrinhos por Produto Individual
-- Execute BLOCO POR BLOCO no DBeaver (selecione, Ctrl+Enter)
-- ============================================

-- BLOCO 1: Criar tabela carrinho_itens
CREATE TABLE IF NOT EXISTS carrinho_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carrinho_id UUID NOT NULL REFERENCES carrinho_usuarios(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  quantidade_inicial INTEGER NOT NULL DEFAULT 0,
  quantidade_atual INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_carrinho_produto UNIQUE (carrinho_id, produto_id),
  CONSTRAINT chk_quantidade_inicial_positiva CHECK (quantidade_inicial >= 0),
  CONSTRAINT chk_quantidade_atual_positiva CHECK (quantidade_atual >= 0)
);

-- BLOCO 2: Criar índices da tabela carrinho_itens
CREATE INDEX IF NOT EXISTS idx_carrinho_itens_carrinho ON carrinho_itens(carrinho_id);
CREATE INDEX IF NOT EXISTS idx_carrinho_itens_produto ON carrinho_itens(produto_id);

-- BLOCO 3: Criar tabela devolucao_carrinho_itens
CREATE TABLE IF NOT EXISTS devolucao_carrinho_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  devolucao_id UUID NOT NULL REFERENCES devolucoes_carrinho(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  quantidade_devolvida INTEGER NOT NULL DEFAULT 0,
  quantidade_esperada INTEGER NOT NULL DEFAULT 0,
  discrepancia INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_devolucao_produto UNIQUE (devolucao_id, produto_id),
  CONSTRAINT chk_quantidade_devolvida_positiva CHECK (quantidade_devolvida >= 0),
  CONSTRAINT chk_quantidade_esperada_positiva CHECK (quantidade_esperada >= 0)
);

-- BLOCO 4: Criar índices da tabela devolucao_carrinho_itens
CREATE INDEX IF NOT EXISTS idx_devolucao_itens_devolucao ON devolucao_carrinho_itens(devolucao_id);
CREATE INDEX IF NOT EXISTS idx_devolucao_itens_produto ON devolucao_carrinho_itens(produto_id);
CREATE INDEX IF NOT EXISTS idx_devolucao_itens_discrepancia ON devolucao_carrinho_itens(discrepancia) WHERE discrepancia != 0;

-- BLOCO 5: Criar função de trigger (se não existir)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- BLOCO 6: Criar triggers
DROP TRIGGER IF EXISTS update_carrinho_itens_updated_at ON carrinho_itens;
CREATE TRIGGER update_carrinho_itens_updated_at
  BEFORE UPDATE ON carrinho_itens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_devolucao_carrinho_itens_updated_at ON devolucao_carrinho_itens;
CREATE TRIGGER update_devolucao_carrinho_itens_updated_at
  BEFORE UPDATE ON devolucao_carrinho_itens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- BLOCO 7: Verificar se foi criado corretamente
SELECT 
  'carrinho_itens' as tabela,
  COUNT(*) as colunas_criadas
FROM information_schema.columns 
WHERE table_name = 'carrinho_itens'
UNION ALL
SELECT 
  'devolucao_carrinho_itens' as tabela,
  COUNT(*) as colunas_criadas
FROM information_schema.columns 
WHERE table_name = 'devolucao_carrinho_itens';

-- ✅ Se mostrar 8 colunas para cada tabela, está correto!
