-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETA - SISTEMA DE ROTEIROS
-- Execute este script no DBeaver para criar todas as tabelas e campos
-- ═══════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════
-- 1. ADICIONAR CAMPO ZONA NA TABELA LOJAS
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE lojas ADD COLUMN IF NOT EXISTS zona VARCHAR(50);

-- Comentário explicativo
COMMENT ON COLUMN lojas.zona IS 'Zona geográfica: Norte, Sul, Leste, Oeste, Centro';

-- ═══════════════════════════════════════════════════════════════════
-- 2. CRIAR TABELA ROTEIROS
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS roteiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  zona VARCHAR(50),
  estado VARCHAR(2),
  cidade VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'pendente',
  "funcionarioId" UUID REFERENCES usuarios(id),
  "funcionarioNome" VARCHAR(100),
  "totalMaquinas" INTEGER DEFAULT 0,
  "maquinasConcluidas" INTEGER DEFAULT 0,
  "saldoRestante" DECIMAL(10,2) DEFAULT 500.00,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Comentários explicativos
COMMENT ON TABLE roteiros IS 'Roteiros de visitas às lojas para manutenção e coleta';
COMMENT ON COLUMN roteiros.zona IS 'Norte, Sul, Leste, Oeste, Centro';
COMMENT ON COLUMN roteiros.status IS 'pendente, em_andamento, concluido';
COMMENT ON COLUMN roteiros."totalMaquinas" IS 'Total de máquinas no roteiro';
COMMENT ON COLUMN roteiros."maquinasConcluidas" IS 'Contador atualizado automaticamente';
COMMENT ON COLUMN roteiros."saldoRestante" IS 'Saldo disponível para despesas (R$)';

-- ═══════════════════════════════════════════════════════════════════
-- 3. CRIAR TABELA ROTEIROS_LOJAS (Relacionamento Many-to-Many)
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS roteiros_lojas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roteiro_id UUID NOT NULL REFERENCES roteiros(id) ON DELETE CASCADE,
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  concluida BOOLEAN DEFAULT FALSE,
  ordem INTEGER,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Comentários explicativos
COMMENT ON TABLE roteiros_lojas IS 'Relacionamento entre roteiros e lojas';
COMMENT ON COLUMN roteiros_lojas.concluida IS 'Se a loja foi concluída no roteiro';
COMMENT ON COLUMN roteiros_lojas.ordem IS 'Ordem de visita (1, 2, 3...)';

-- ═══════════════════════════════════════════════════════════════════
-- 4. ADICIONAR CAMPO ROTEIRO_ID NA TABELA MOVIMENTACOES
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE movimentacoes ADD COLUMN IF NOT EXISTS roteiro_id UUID REFERENCES roteiros(id);

-- Comentário explicativo
COMMENT ON COLUMN movimentacoes.roteiro_id IS 'Roteiro ao qual a movimentação pertence';

-- ═══════════════════════════════════════════════════════════════════
-- 5. CRIAR TABELA ROTEIROS_GASTOS
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS roteiros_gastos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roteiro_id UUID NOT NULL REFERENCES roteiros(id) ON DELETE CASCADE,
  categoria VARCHAR(50),
  valor DECIMAL(10,2),
  descricao TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Comentários explicativos
COMMENT ON TABLE roteiros_gastos IS 'Despesas do roteiro (combustível, alimentação, etc)';
COMMENT ON COLUMN roteiros_gastos.categoria IS 'Combustível, Alimentação, Pedágio, Estacionamento, Outros';

-- ═══════════════════════════════════════════════════════════════════
-- 6. CRIAR ÍNDICES PARA MELHOR PERFORMANCE
-- ═══════════════════════════════════════════════════════════════════

-- Índices na tabela roteiros
CREATE INDEX IF NOT EXISTS idx_roteiros_data ON roteiros(data);
CREATE INDEX IF NOT EXISTS idx_roteiros_status ON roteiros(status);
CREATE INDEX IF NOT EXISTS idx_roteiros_zona ON roteiros(zona);
CREATE INDEX IF NOT EXISTS idx_roteiros_funcionario ON roteiros("funcionarioId");

-- Índices na tabela roteiros_lojas
CREATE INDEX IF NOT EXISTS idx_roteiros_lojas_roteiro_id ON roteiros_lojas(roteiro_id);
CREATE INDEX IF NOT EXISTS idx_roteiros_lojas_loja_id ON roteiros_lojas(loja_id);
CREATE INDEX IF NOT EXISTS idx_roteiros_lojas_concluida ON roteiros_lojas(concluida);

-- Índices na tabela roteiros_gastos
CREATE INDEX IF NOT EXISTS idx_roteiros_gastos_roteiro_id ON roteiros_gastos(roteiro_id);

-- Índice na tabela movimentacoes
CREATE INDEX IF NOT EXISTS idx_movimentacoes_roteiro_id ON movimentacoes(roteiro_id);

-- Índice na tabela lojas
CREATE INDEX IF NOT EXISTS idx_lojas_zona ON lojas(zona);

-- ═══════════════════════════════════════════════════════════════════
-- 7. VERIFICAÇÃO - Executar após criar tudo
-- ═══════════════════════════════════════════════════════════════════

-- Verificar se as tabelas foram criadas
SELECT 
  'roteiros' as tabela, 
  COUNT(*) as existe 
FROM information_schema.tables 
WHERE table_name = 'roteiros'
UNION ALL
SELECT 
  'roteiros_lojas' as tabela, 
  COUNT(*) as existe 
FROM information_schema.tables 
WHERE table_name = 'roteiros_lojas'
UNION ALL
SELECT 
  'roteiros_gastos' as tabela, 
  COUNT(*) as existe 
FROM information_schema.tables 
WHERE table_name = 'roteiros_gastos';

-- Verificar se os campos foram adicionados
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'lojas' 
  AND column_name = 'zona';

SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'movimentacoes' 
  AND column_name = 'roteiro_id';

-- ═══════════════════════════════════════════════════════════════════
-- 8. POPULAR ZONAS NAS LOJAS EXISTENTES (ADAPTE OS IDs)
-- ═══════════════════════════════════════════════════════════════════

-- IMPORTANTE: Primeiro, veja suas lojas
SELECT id, nome, cidade, estado, zona, ativo FROM lojas ORDER BY cidade;

-- Depois, atualize conforme a localização real das suas lojas
-- SUBSTITUA os IDs pelos IDs reais das suas lojas!

-- Exemplo: Se você tem lojas em São Paulo
-- UPDATE lojas SET zona = 'Norte' WHERE cidade = 'São Paulo' AND nome LIKE '%Norte%';
-- UPDATE lojas SET zona = 'Sul' WHERE cidade = 'São Paulo' AND nome LIKE '%Sul%';

-- Exemplo: Por ID específico
-- UPDATE lojas SET zona = 'Norte' WHERE id = 'seu-uuid-aqui';

-- Exemplo: Por múltiplos IDs
-- UPDATE lojas SET zona = 'Norte' WHERE id IN (
--   'uuid-loja-1',
--   'uuid-loja-2',
--   'uuid-loja-3'
-- );

-- Exemplo: Por cidade
-- UPDATE lojas SET zona = 'Norte' WHERE cidade IN ('Santana', 'Tucuruvi', 'Vila Guilherme');
-- UPDATE lojas SET zona = 'Sul' WHERE cidade IN ('Santo Amaro', 'Jabaquara', 'Vila Mariana');
-- UPDATE lojas SET zona = 'Leste' WHERE cidade IN ('Tatuapé', 'Penha', 'Itaquera');
-- UPDATE lojas SET zona = 'Oeste' WHERE cidade IN ('Pinheiros', 'Butantã', 'Lapa');
-- UPDATE lojas SET zona = 'Centro' WHERE cidade IN ('Sé', 'República', 'Centro');

-- ═══════════════════════════════════════════════════════════════════
-- 9. VALIDAÇÃO FINAL
-- ═══════════════════════════════════════════════════════════════════

-- Contar lojas por zona
SELECT 
  zona, 
  COUNT(*) as total_lojas,
  SUM(CASE WHEN ativo = true THEN 1 ELSE 0 END) as lojas_ativas
FROM lojas 
GROUP BY zona
ORDER BY zona;

-- Ver lojas sem zona definida
SELECT id, nome, cidade, estado 
FROM lojas 
WHERE zona IS NULL 
  AND ativo = true;

-- Ver quantas máquinas por loja
SELECT 
  l.id,
  l.nome as loja,
  l.zona,
  COUNT(m.id) as total_maquinas,
  SUM(CASE WHEN m.ativo = true THEN 1 ELSE 0 END) as maquinas_ativas
FROM lojas l 
LEFT JOIN maquinas m ON l.id = m."lojaId"
WHERE l.ativo = true
GROUP BY l.id, l.nome, l.zona
ORDER BY l.zona, l.nome;

-- ═══════════════════════════════════════════════════════════════════
-- ✅ TUDO PRONTO!
-- ═══════════════════════════════════════════════════════════════════

SELECT 
  '✅ Migration concluída com sucesso!' as status,
  'Agora reinicie o servidor backend (npm start)' as proxima_etapa,
  'Depois teste gerar roteiros no frontend' as teste;

  
