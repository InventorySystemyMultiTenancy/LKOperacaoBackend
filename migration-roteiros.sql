-- Migration manual de roteiros (PostgreSQL)
-- Execute este script se preferir criar as tabelas manualmente

-- 1. Adicionar campo zona na tabela lojas
ALTER TABLE lojas ADD COLUMN IF NOT EXISTS zona VARCHAR(50);

-- 2. Criar tabela roteiros
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

-- 3. Criar tabela roteiros_lojas
CREATE TABLE IF NOT EXISTS roteiros_lojas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roteiro_id UUID NOT NULL REFERENCES roteiros(id) ON DELETE CASCADE,
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  concluida BOOLEAN DEFAULT FALSE,
  ordem INTEGER,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Adicionar campo roteiro_id na tabela movimentacoes
ALTER TABLE movimentacoes ADD COLUMN IF NOT EXISTS roteiro_id UUID REFERENCES roteiros(id);

-- 5. Criar tabela roteiros_gastos
CREATE TABLE IF NOT EXISTS roteiros_gastos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roteiro_id UUID NOT NULL REFERENCES roteiros(id) ON DELETE CASCADE,
  categoria VARCHAR(50),
  valor DECIMAL(10,2),
  descricao TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_roteiros_data ON roteiros(data);
CREATE INDEX IF NOT EXISTS idx_roteiros_status ON roteiros(status);
CREATE INDEX IF NOT EXISTS idx_roteiros_lojas_roteiro_id ON roteiros_lojas(roteiro_id);
CREATE INDEX IF NOT EXISTS idx_roteiros_lojas_loja_id ON roteiros_lojas(loja_id);
CREATE INDEX IF NOT EXISTS idx_roteiros_gastos_roteiro_id ON roteiros_gastos(roteiro_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_roteiro_id ON movimentacoes(roteiro_id);
CREATE INDEX IF NOT EXISTS idx_lojas_zona ON lojas(zona);

-- Verificação
SELECT 'Tabelas criadas com sucesso!' as status;

-- Contar registros
SELECT 
  (SELECT COUNT(*) FROM roteiros) as total_roteiros,
  (SELECT COUNT(*) FROM roteiros_lojas) as total_roteiros_lojas,
  (SELECT COUNT(*) FROM roteiros_gastos) as total_roteiros_gastos,
  (SELECT COUNT(*) FROM lojas WHERE zona IS NOT NULL) as lojas_com_zona;
