-- ============================================
-- MIGRATION: Carrinhos por Produto Individual
-- Data: 2026-03-11
-- Descrição: Adiciona tabelas para controle de produtos individuais nos carrinhos
-- ============================================

-- Criar tabela carrinho_itens (itens individuais do carrinho)
CREATE TABLE IF NOT EXISTS carrinho_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carrinho_id UUID NOT NULL REFERENCES carrinho_usuarios(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  quantidade_inicial INTEGER NOT NULL DEFAULT 0,
  quantidade_atual INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Garantir que cada produto aparece apenas uma vez por carrinho
  CONSTRAINT unique_carrinho_produto UNIQUE (carrinho_id, produto_id),
  
  -- Validações
  CONSTRAINT chk_quantidade_inicial_positiva CHECK (quantidade_inicial >= 0),
  CONSTRAINT chk_quantidade_atual_positiva CHECK (quantidade_atual >= 0)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_carrinho_itens_carrinho ON carrinho_itens(carrinho_id);
CREATE INDEX IF NOT EXISTS idx_carrinho_itens_produto ON carrinho_itens(produto_id);

-- Comentários
COMMENT ON TABLE carrinho_itens IS 'Itens individuais (produtos) de cada carrinho do usuário';
COMMENT ON COLUMN carrinho_itens.quantidade_inicial IS 'Quantidade inicial deste produto no carrinho';
COMMENT ON COLUMN carrinho_itens.quantidade_atual IS 'Quantidade restante deste produto (diminui com movimentações)';

-- ============================================

-- Criar tabela devolucao_carrinho_itens (itens da devolução por produto)
CREATE TABLE IF NOT EXISTS devolucao_carrinho_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  devolucao_id UUID NOT NULL REFERENCES devolucoes_carrinho(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  quantidade_devolvida INTEGER NOT NULL DEFAULT 0,
  quantidade_esperada INTEGER NOT NULL DEFAULT 0,
  discrepancia INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Garantir que cada produto aparece apenas uma vez por devolução
  CONSTRAINT unique_devolucao_produto UNIQUE (devolucao_id, produto_id),
  
  -- Validações
  CONSTRAINT chk_quantidade_devolvida_positiva CHECK (quantidade_devolvida >= 0),
  CONSTRAINT chk_quantidade_esperada_positiva CHECK (quantidade_esperada >= 0)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_devolucao_itens_devolucao ON devolucao_carrinho_itens(devolucao_id);
CREATE INDEX IF NOT EXISTS idx_devolucao_itens_produto ON devolucao_carrinho_itens(produto_id);
CREATE INDEX IF NOT EXISTS idx_devolucao_itens_discrepancia ON devolucao_carrinho_itens(discrepancia) WHERE discrepancia != 0;

-- Comentários
COMMENT ON TABLE devolucao_carrinho_itens IS 'Itens individuais (produtos) de cada devolução de carrinho';
COMMENT ON COLUMN devolucao_carrinho_itens.quantidade_devolvida IS 'Quantidade deste produto que foi devolvida';
COMMENT ON COLUMN devolucao_carrinho_itens.quantidade_esperada IS 'Quantidade que deveria ter sobrado deste produto';
COMMENT ON COLUMN devolucao_carrinho_itens.discrepancia IS 'Diferença entre devolvida e esperada (positivo = sobra, negativo = falta)';

-- ============================================
-- TRIGGERS para atualizar updated_at automaticamente
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_carrinho_itens_updated_at
  BEFORE UPDATE ON carrinho_itens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_devolucao_carrinho_itens_updated_at
  BEFORE UPDATE ON devolucao_carrinho_itens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SUCCESS
-- ============================================

SELECT 'Migration concluída com sucesso! Tabelas carrinho_itens e devolucao_carrinho_itens criadas.' AS status;
