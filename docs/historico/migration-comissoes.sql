-- ============================================
-- MIGRATION: Sistema de Comissões
-- Data: 2026-01-15
-- Descrição: Adiciona campo de comissão nas máquinas
--            e cria tabela para armazenar comissões
-- ============================================

-- 1. Adicionar coluna percentual_comissao na tabela maquinas
ALTER TABLE maquinas 
ADD COLUMN percentual_comissao DECIMAL(5, 2) DEFAULT 0;

COMMENT ON COLUMN maquinas.percentual_comissao IS 'Percentual de comissão sobre o lucro da máquina (0-100%)';

-- 2. Criar tabela comissoes_lojas (EXECUTE ESTE BLOCO COMPLETO)
CREATE TABLE IF NOT EXISTS comissoes_lojas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loja_id UUID NOT NULL,
    roteiro_id UUID,
    data_calculo TIMESTAMP NOT NULL DEFAULT NOW(),
    total_lucro DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_comissao DECIMAL(10, 2) NOT NULL DEFAULT 0,
    detalhes JSONB,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. Adicionar foreign keys separadamente
ALTER TABLE comissoes_lojas 
    ADD CONSTRAINT fk_comissoes_loja
    FOREIGN KEY (loja_id) 
    REFERENCES lojas(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE;

ALTER TABLE comissoes_lojas 
    ADD CONSTRAINT fk_comissoes_roteiro
    FOREIGN KEY (roteiro_id)
    REFERENCES roteiros(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL;

-- Comentários da tabela
COMMENT ON TABLE comissoes_lojas IS 'Armazena o histórico de comissões calculadas por loja';
COMMENT ON COLUMN comissoes_lojas.loja_id IS 'ID da loja';
COMMENT ON COLUMN comissoes_lojas.roteiro_id IS 'ID do roteiro em que foi finalizada (opcional)';
COMMENT ON COLUMN comissoes_lojas.data_calculo IS 'Data em que a comissão foi calculada';
COMMENT ON COLUMN comissoes_lojas.total_lucro IS 'Lucro total das máquinas da loja';
COMMENT ON COLUMN comissoes_lojas.total_comissao IS 'Comissão total calculada';
COMMENT ON COLUMN comissoes_lojas.detalhes IS 'Detalhes das comissões por máquina (JSON)';

-- Criar índices para melhor performance
CREATE INDEX idx_comissoes_loja_id ON comissoes_lojas(loja_id);
CREATE INDEX idx_comissoes_roteiro_id ON comissoes_lojas(roteiro_id);
CREATE INDEX idx_comissoes_data_calculo ON comissoes_lojas(data_calculo);

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Verificar se a coluna foi adicionada
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'maquinas' 
AND column_name = 'percentual_comissao';

-- Verificar se a tabela foi criada
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'comissoes_lojas';

-- Visualizar estrutura da nova tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'comissoes_lojas'
ORDER BY ordinal_position;

-- ============================================
-- ROLLBACK (caso precise desfazer)
-- ============================================
-- CUIDADO: Só execute isso se quiser reverter as alterações!
-- 
-- DROP TABLE IF EXISTS comissoes_lojas;
-- ALTER TABLE maquinas DROP COLUMN IF EXISTS percentual_comissao;
