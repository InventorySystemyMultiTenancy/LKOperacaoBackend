-- ============================================
-- DIAGNÓSTICO: descobrir posId e período usados na busca que crashou
-- Movimentação com erro: 55ac3f7e-7b7e-467d-910d-0775d809dc3e
-- ============================================

-- 1. Dados da movimentação que falhou + máquina + posId
SELECT
    m.id AS movimentacao_id,
    m.data_coleta,
    m.maquina_id,
    maq.codigo AS maquina_codigo,
    maq.nome AS maquina_nome,
    maq.machine_pay_pos_id
FROM movimentacoes m
JOIN maquinas maq ON maq.id = m.maquina_id
WHERE m.id = '55ac3f7e-7b7e-467d-910d-0775d809dc3e';

-- 2. Movimentação anterior da mesma máquina (define o "início" do período buscado)
--    Substitua <MAQUINA_ID> pelo maquina_id retornado acima
SELECT
    id AS movimentacao_anterior_id,
    data_coleta AS inicio_periodo_buscado
FROM movimentacoes
WHERE maquina_id = (
    SELECT maquina_id FROM movimentacoes WHERE id = '55ac3f7e-7b7e-467d-910d-0775d809dc3e'
)
AND data_coleta < (
    SELECT data_coleta FROM movimentacoes WHERE id = '55ac3f7e-7b7e-467d-910d-0775d809dc3e'
)
ORDER BY data_coleta DESC
LIMIT 1;

-- ============================================
-- FIM
-- ============================================
