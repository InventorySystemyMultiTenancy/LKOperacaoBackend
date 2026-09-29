-- ============================================
-- MIGRATION: Sistema de Carrinho de Produtos por Usuário
-- Data: 2026-03-10
-- ============================================

-- Descrição:
-- Este script cria as tabelas necessárias para o sistema de carrinho
-- de produtos por usuário, onde:
-- 1. Admin define quantidade inicial diária para cada usuário
-- 2. Sistema desconta automaticamente nas movimentações de abastecimento
-- 3. Usuário registra devolução ao final do dia
-- 4. Sistema gera alertas se houver discrepância

-- ============================================
-- 1. Criar tabela carrinho_usuarios
-- ============================================

CREATE TABLE IF NOT EXISTS carrinho_usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE CASCADE,
  quantidade_inicial INTEGER NOT NULL DEFAULT 0,
  quantidade_atual INTEGER NOT NULL DEFAULT 0,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_usuario_data UNIQUE (usuario_id, data)
);

-- Adicionar comentários às colunas
COMMENT ON TABLE carrinho_usuarios IS 'Carrinhos diários de produtos por usuário';
COMMENT ON COLUMN carrinho_usuarios.quantidade_inicial IS 'Quantidade total de produtos que o usuário levou no início do dia';
COMMENT ON COLUMN carrinho_usuarios.quantidade_atual IS 'Quantidade atual no carrinho (vai diminuindo com as movimentações)';
COMMENT ON COLUMN carrinho_usuarios.data IS 'Data do carrinho';
COMMENT ON COLUMN carrinho_usuarios.ativo IS 'Se o carrinho ainda está ativo (desativado ao final do dia)';

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_carrinho_usuarios_usuario_id ON carrinho_usuarios(usuario_id);
CREATE INDEX IF NOT EXISTS idx_carrinho_usuarios_data ON carrinho_usuarios(data);
CREATE INDEX IF NOT EXISTS idx_carrinho_usuarios_ativo ON carrinho_usuarios(ativo);

-- ============================================
-- 2. Criar tabela devolucoes_carrinho
-- ============================================

CREATE TABLE IF NOT EXISTS devolucoes_carrinho (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  carrinho_id UUID NOT NULL REFERENCES carrinho_usuarios(id) ON UPDATE CASCADE ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE CASCADE,
  quantidade_devolvida INTEGER NOT NULL,
  quantidade_esperada INTEGER NOT NULL,
  discrepancia INTEGER NOT NULL DEFAULT 0,
  alerta_ativo BOOLEAN NOT NULL DEFAULT TRUE,
  observacao TEXT,
  data_devolucao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Adicionar comentários às colunas
COMMENT ON TABLE devolucoes_carrinho IS 'Registro de devoluções de produtos do carrinho';
COMMENT ON COLUMN devolucoes_carrinho.usuario_id IS 'Usuário que está devolvendo os produtos';
COMMENT ON COLUMN devolucoes_carrinho.quantidade_devolvida IS 'Quantidade informada pelo usuário que está devolvendo';
COMMENT ON COLUMN devolucoes_carrinho.quantidade_esperada IS 'Quantidade que deveria sobrar no carrinho (quantidadeAtual)';
COMMENT ON COLUMN devolucoes_carrinho.discrepancia IS 'Diferença entre devolvida e esperada (positivo = sobra, negativo = falta)';
COMMENT ON COLUMN devolucoes_carrinho.alerta_ativo IS 'Se o alerta de inconsistência está ativo (pode ser desligado pelo admin)';

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_devolucoes_carrinho_carrinho_id ON devolucoes_carrinho(carrinho_id);
CREATE INDEX IF NOT EXISTS idx_devolucoes_carrinho_usuario_id ON devolucoes_carrinho(usuario_id);
CREATE INDEX IF NOT EXISTS idx_devolucoes_carrinho_alerta_ativo ON devolucoes_carrinho(alerta_ativo);
CREATE INDEX IF NOT EXISTS idx_devolucoes_carrinho_data_devolucao ON devolucoes_carrinho(data_devolucao);

-- ============================================
-- 3. Verificação de sucesso
-- ============================================

-- Verificar se as tabelas foram criadas
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name IN ('carrinho_usuarios', 'devolucoes_carrinho')
ORDER BY table_name, ordinal_position;

-- Verificar constraints
SELECT tc.table_name, tc.constraint_name, tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_name IN ('carrinho_usuarios', 'devolucoes_carrinho')
ORDER BY tc.table_name, tc.constraint_type;

-- Verificar índices
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename IN ('carrinho_usuarios', 'devolucoes_carrinho')
ORDER BY tablename, indexname;

-- ============================================
-- FIM DA MIGRATION
-- ============================================

-- ✅ Execute este script no DBeaver conectado ao banco de produção (Render)
-- ✅ Após executar, verifique os resultados das queries de verificação
-- ✅ Faça commit Git e push para o Render fazer deploy do código backend
