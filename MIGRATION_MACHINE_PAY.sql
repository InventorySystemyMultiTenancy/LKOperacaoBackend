-- ============================================
-- MIGRATION: Integração Machine Pay (Cyberpix)
-- Data: 2026-07-13
-- Descrição: Campos na tabela maquinas para vincular cada máquina
--            ao leitor PIX/cartão (posId) cadastrado no painel Machine Pay
-- ============================================

-- 1. Adicionar coluna machine_pay_pos_id
ALTER TABLE maquinas
ADD COLUMN IF NOT EXISTS machine_pay_pos_id VARCHAR(50);

-- 2. Adicionar coluna machine_pay_usr_id
ALTER TABLE maquinas
ADD COLUMN IF NOT EXISTS machine_pay_usr_id VARCHAR(50);

-- 3. Garantir que um posId só pode pertencer a uma máquina
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'maquinas_machine_pay_pos_id_key'
    ) THEN
        ALTER TABLE maquinas
        ADD CONSTRAINT maquinas_machine_pay_pos_id_key
        UNIQUE (machine_pay_pos_id);
    END IF;
END $$;

-- 4. Adicionar comentários nas colunas
COMMENT ON COLUMN maquinas.machine_pay_pos_id IS 'ID do POS (leitor PIX/cartão) cadastrado no painel Machine Pay';
COMMENT ON COLUMN maquinas.machine_pay_usr_id IS 'ID da conta/cliente dona do posId no painel Machine Pay';

-- 5. Verificar se as colunas foram criadas corretamente
SELECT
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'maquinas'
  AND column_name IN ('machine_pay_pos_id', 'machine_pay_usr_id')
ORDER BY column_name;

-- 6. Verificar se a constraint UNIQUE foi criada
SELECT conname, contype
FROM pg_constraint
WHERE conname = 'maquinas_machine_pay_pos_id_key';

-- ============================================
-- ROLLBACK (caso precise desfazer)
-- ============================================
-- ALTER TABLE maquinas DROP CONSTRAINT IF EXISTS maquinas_machine_pay_pos_id_key;
-- ALTER TABLE maquinas DROP COLUMN IF EXISTS machine_pay_pos_id;
-- ALTER TABLE maquinas DROP COLUMN IF EXISTS machine_pay_usr_id;

-- ============================================
-- FIM DA MIGRATION
-- ============================================
