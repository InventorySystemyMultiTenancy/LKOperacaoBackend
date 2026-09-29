-- ============================================
-- CORREÇÃO: Permitir saldo negativo em carrinho_itens.quantidade_atual
-- Data: 2026-07-20
-- ============================================
--
-- Motivo:
-- O backend limitava (Math.max(0, ...)) o desconto do carrinho quando uma
-- movimentação abastecia mais unidades de um produto do que o funcionário
-- tinha alocado no carrinho. Isso escondia o excedente: na devolução, o
-- sistema mostrava "esperado: 0" em vez do déficit real (ex: usou 60 de um
-- produto que tinha só 50 alocados, e o sistema "esquecia" os 10 a mais).
--
-- Com a CHECK constraint removida, quantidade_atual pode ficar negativa,
-- refletindo com precisão quanto o funcionário usou além do alocado.
-- quantidade_inicial continua protegida (nunca deve ser negativa).
--
-- ⚠️ Execute este script no banco de produção (mesmo fluxo usado para as
-- migrations MIGRATION_CARRINHOS_POR_PRODUTO.sql / CORRECAO_USUARIO_DEVOLUCOES_ANTIGAS.sql)

-- 1) PREVIEW da constraint atual
SELECT conname, pg_get_constraintdef(oid) AS definicao
FROM pg_constraint
WHERE conrelid = 'carrinho_itens'::regclass
  AND conname = 'chk_quantidade_atual_positiva';

-- 2) CORREÇÃO
ALTER TABLE carrinho_itens
  DROP CONSTRAINT IF EXISTS chk_quantidade_atual_positiva;

-- 3) Confirmação (não deve retornar nenhuma linha)
SELECT conname, pg_get_constraintdef(oid) AS definicao
FROM pg_constraint
WHERE conrelid = 'carrinho_itens'::regclass
  AND conname = 'chk_quantidade_atual_positiva';
