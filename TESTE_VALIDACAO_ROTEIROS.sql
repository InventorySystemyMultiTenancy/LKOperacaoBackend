-- ═══════════════════════════════════════════════════════════════════
-- VALIDAÇÃO COMPLETA DO SISTEMA DE ROTEIROS
-- Execute este script para verificar se tudo está funcionando corretamente
-- ═══════════════════════════════════════════════════════════════════

-- 🎯 1. VISÃO GERAL DOS ROTEIROS DE HOJE
SELECT 
    '=== ROTEIROS DE HOJE ===' as titulo;

SELECT 
    r.id,
    r.zona,
    r.status,
    r."funcionarioNome" as funcionario,
    COUNT(DISTINCT rl.loja_id) as total_lojas,
    COUNT(DISTINCT CASE WHEN rl.concluida = true THEN rl.loja_id END) as lojas_concluidas,
    COUNT(DISTINCT m.id) as total_maquinas,
    COUNT(DISTINCT mov.id) as total_movimentacoes,
    COUNT(DISTINCT CASE WHEN mov.id IS NOT NULL THEN m.id END) as maquinas_atendidas
FROM roteiros r
LEFT JOIN roteiros_lojas rl ON rl.roteiro_id = r.id
LEFT JOIN lojas l ON l.id = rl.loja_id
LEFT JOIN maquinas m ON m."lojaId" = l.id AND m.ativo = true
LEFT JOIN movimentacoes mov ON mov."maquinaId" = m.id AND mov.roteiro_id = r.id
WHERE r.data = CURRENT_DATE
GROUP BY r.id, r.zona, r.status, r."funcionarioNome"
ORDER BY r.zona;

-- 🔍 2. DETALHAMENTO POR LOJA (Para verificar quais lojas estão prontas para ficarem verdes)
SELECT 
    '=== DETALHAMENTO POR LOJA ===' as titulo;

WITH loja_status AS (
    SELECT 
        r.id as roteiro_id,
        r.zona,
        l.id as loja_id,
        l.nome as loja_nome,
        rl.concluida,
        rl.ordem,
        COUNT(m.id) as total_maquinas_loja,
        COUNT(DISTINCT CASE WHEN mov.id IS NOT NULL THEN m.id END) as maquinas_atendidas_loja,
        CASE 
            WHEN COUNT(m.id) > 0 AND COUNT(m.id) = COUNT(DISTINCT CASE WHEN mov.id IS NOT NULL THEN m.id END) 
            THEN '✅ PRONTA PARA FINALIZAR (VERDE)'
            WHEN COUNT(DISTINCT CASE WHEN mov.id IS NOT NULL THEN m.id END) > 0
            THEN '⏳ EM PROGRESSO (AMARELO)'
            ELSE '⚪ NÃO INICIADA (BRANCO)'
        END as status_visual
    FROM roteiros r
    JOIN roteiros_lojas rl ON rl.roteiro_id = r.id
    JOIN lojas l ON l.id = rl.loja_id
    LEFT JOIN maquinas m ON m."lojaId" = l.id AND m.ativo = true
    LEFT JOIN movimentacoes mov ON mov."maquinaId" = m.id AND mov.roteiro_id = r.id
    WHERE r.data = CURRENT_DATE
    GROUP BY r.id, r.zona, l.id, l.nome, rl.concluida, rl.ordem
)
SELECT 
    zona,
    ordem,
    loja_nome,
    total_maquinas_loja,
    maquinas_atendidas_loja,
    status_visual,
    CASE WHEN concluida THEN 'SIM ✅' ELSE 'NÃO' END as loja_marcada_concluida
FROM loja_status
ORDER BY zona, ordem;

-- 📊 3. DETALHAMENTO POR MÁQUINA (Para ver exatamente qual máquina foi atendida)
SELECT 
    '=== DETALHAMENTO POR MÁQUINA ===' as titulo;

SELECT 
    r.zona,
    l.nome as loja,
    m.codigo as maquina_codigo,
    m.nome as maquina_nome,
    CASE 
        WHEN mov.id IS NOT NULL THEN '✅ ATENDIDA' 
        ELSE '❌ PENDENTE' 
    END as status_maquina,
    mov.id as movimentacao_id,
    mov."createdAt" as data_movimentacao
FROM roteiros r
JOIN roteiros_lojas rl ON rl.roteiro_id = r.id
JOIN lojas l ON l.id = rl.loja_id
JOIN maquinas m ON m."lojaId" = l.id AND m.ativo = true
LEFT JOIN movimentacoes mov ON mov."maquinaId" = m.id AND mov.roteiro_id = r.id
WHERE r.data = CURRENT_DATE
ORDER BY r.zona, l.nome, m.codigo;

-- 🚨 4. VERIFICAR MOVIMENTAÇÕES SEM ROTEIRO_ID (PROBLEMA POTENCIAL)
SELECT 
    '=== MOVIMENTAÇÕES SEM ROTEIRO ===' as titulo;

SELECT 
    COUNT(*) as total_movimentacoes_sem_roteiro,
    MIN("createdAt") as primeira_sem_roteiro,
    MAX("createdAt") as ultima_sem_roteiro
FROM movimentacoes
WHERE roteiro_id IS NULL
    AND "createdAt" >= CURRENT_DATE;

-- Se houver movimentações sem roteiro_id, mostrar detalhes:
SELECT 
    mov.id,
    mov."maquinaId",
    m.codigo as maquina_codigo,
    l.nome as loja,
    mov."createdAt"
FROM movimentacoes mov
JOIN maquinas m ON m.id = mov."maquinaId"
JOIN lojas l ON l.id = m."lojaId"
WHERE mov.roteiro_id IS NULL
    AND mov."createdAt" >= CURRENT_DATE
ORDER BY mov."createdAt" DESC
LIMIT 20;

-- 📋 5. RESUMO EXECUTIVO - O QUE ESTÁ FUNCIONANDO E O QUE NÃO ESTÁ
SELECT 
    '=== RESUMO EXECUTIVO ===' as titulo;

WITH stats AS (
    SELECT 
        COUNT(DISTINCT r.id) as total_roteiros,
        COUNT(DISTINCT rl.loja_id) as total_lojas_em_roteiros,
        COUNT(DISTINCT CASE WHEN rl.concluida THEN rl.loja_id END) as lojas_marcadas_concluidas,
        COUNT(DISTINCT m.id) as total_maquinas,
        COUNT(DISTINCT CASE WHEN mov.id IS NOT NULL THEN m.id END) as maquinas_com_movimentacao,
        COUNT(DISTINCT mov.id) as total_movimentacoes,
        COUNT(DISTINCT CASE WHEN mov.roteiro_id IS NOT NULL THEN mov.id END) as movimentacoes_vinculadas_roteiro
    FROM roteiros r
    LEFT JOIN roteiros_lojas rl ON rl.roteiro_id = r.id
    LEFT JOIN lojas l ON l.id = rl.loja_id
    LEFT JOIN maquinas m ON m."lojaId" = l.id AND m.ativo = true
    LEFT JOIN movimentacoes mov ON mov."maquinaId" = m.id AND mov."createdAt" >= CURRENT_DATE
    WHERE r.data = CURRENT_DATE
)
SELECT 
    'Total de Roteiros' as metrica,
    total_roteiros as valor,
    '📅' as icone
FROM stats
UNION ALL
SELECT 
    'Lojas em Roteiros',
    total_lojas_em_roteiros,
    '🏪'
FROM stats
UNION ALL
SELECT 
    'Lojas Marcadas como Concluídas',
    lojas_marcadas_concluidas,
    '✅'
FROM stats
UNION ALL
SELECT 
    'Total de Máquinas',
    total_maquinas,
    '🎰'
FROM stats
UNION ALL
SELECT 
    'Máquinas com Movimentação (Hoje)',
    maquinas_com_movimentacao,
    '✔️'
FROM stats
UNION ALL
SELECT 
    'Total de Movimentações (Hoje)',
    total_movimentacoes,
    '📊'
FROM stats
UNION ALL
SELECT 
    'Movimentações Vinculadas a Roteiro',
    movimentacoes_vinculadas_roteiro,
    '🔗'
FROM stats;

-- 🎯 6. TESTE ESPECÍFICO - Pegar um roteiro e verificar se está correto
SELECT 
    '=== ANÁLISE DE ROTEIRO ESPECÍFICO ===' as titulo;

-- Pegar o primeiro roteiro de hoje que tem lojas
WITH roteiro_teste AS (
    SELECT id, zona
    FROM roteiros
    WHERE data = CURRENT_DATE
    ORDER BY zona
    LIMIT 1
)
SELECT 
    rt.zona as roteiro_zona,
    'Loja: ' || l.nome as info,
    'Total de Máquinas: ' || COUNT(m.id) as quantidade_total,
    'Máquinas Atendidas: ' || COUNT(DISTINCT CASE WHEN mov.id IS NOT NULL THEN m.id END) as quantidade_atendida,
    CASE 
        WHEN COUNT(m.id) = COUNT(DISTINCT CASE WHEN mov.id IS NOT NULL THEN m.id END) AND COUNT(m.id) > 0
        THEN '🟢 LOJA DEVE FICAR VERDE - TODAS AS MÁQUINAS ATENDIDAS'
        WHEN COUNT(DISTINCT CASE WHEN mov.id IS NOT NULL THEN m.id END) > 0
        THEN '🟡 LOJA EM PROGRESSO - ALGUMAS MÁQUINAS ATENDIDAS'
        ELSE '⚪ LOJA NÃO INICIADA'
    END as resultado_esperado
FROM roteiro_teste rt
JOIN roteiros_lojas rl ON rl.roteiro_id = rt.id
JOIN lojas l ON l.id = rl.loja_id
LEFT JOIN maquinas m ON m."lojaId" = l.id AND m.ativo = true
LEFT JOIN movimentacoes mov ON mov."maquinaId" = m.id AND mov.roteiro_id = rt.id
GROUP BY rt.zona, l.nome
ORDER BY l.nome;

-- ═══════════════════════════════════════════════════════════════════
-- INTERPRETAÇÃO DOS RESULTADOS:
-- 
-- ✅ TUDO FUNCIONANDO SE:
--    - Movimentações têm roteiro_id preenchido
--    - Lojas com todas as máquinas atendidas aparecem como "PRONTA PARA FINALIZAR"
--    - O contador de máquinas atendidas bate com o total
--
-- ❌ PROBLEMA SE:
--    - Movimentações sem roteiro_id (aparecerão na seção 4)
--    - Máquinas marcadas como atendidas mas sem movimentação
--    - Lojas com todas máquinas atendidas mas não aparecem em verde no frontend
-- ═══════════════════════════════════════════════════════════════════
