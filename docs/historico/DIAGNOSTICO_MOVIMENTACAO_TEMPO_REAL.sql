-- ═══════════════════════════════════════════════════════════════════
-- DIAGNÓSTICO EM TEMPO REAL - MOVIMENTAÇÕES
-- Execute este comando IMEDIATAMENTE APÓS salvar uma movimentação
-- ═══════════════════════════════════════════════════════════════════

-- 🔴 EXECUTE ESTE BLOCO APÓS SALVAR UMA MOVIMENTAÇÃO

-- 1. VER AS ÚLTIMAS 5 MOVIMENTAÇÕES CRIADAS
SELECT 
    '=== ÚLTIMAS MOVIMENTAÇÕES ===' as diagnostico;

SELECT 
    mov.id,
    mov."maquinaId",
    m.codigo as maquina_codigo,
    m.nome as maquina_nome,
    l.nome as loja_nome,
    mov.roteiro_id,
    r.zona as roteiro_zona,
    mov."createdAt",
    CASE 
        WHEN mov.roteiro_id IS NOT NULL THEN '✅ COM ROTEIRO'
        ELSE '❌ SEM ROTEIRO (PROBLEMA!)'
    END as status_roteiro
FROM movimentacoes mov
JOIN maquinas m ON m.id = mov."maquinaId"
JOIN lojas l ON l.id = m."lojaId"
LEFT JOIN roteiros r ON r.id = mov.roteiro_id
ORDER BY mov."createdAt" DESC
LIMIT 5;

-- 2. VERIFICAR SE A ÚLTIMA MOVIMENTAÇÃO TEM ROTEIRO_ID
SELECT 
    '=== STATUS DA ÚLTIMA MOVIMENTAÇÃO ===' as diagnostico;

WITH ultima AS (
    SELECT 
        mov.id,
        mov."maquinaId",
        mov.roteiro_id,
        mov."createdAt",
        m.codigo as maquina_codigo,
        l.nome as loja_nome
    FROM movimentacoes mov
    JOIN maquinas m ON m.id = mov."maquinaId"
    JOIN lojas l ON l.id = m."lojaId"
    ORDER BY mov."createdAt" DESC
    LIMIT 1
)
SELECT 
    id as movimentacao_id,
    maquina_codigo,
    loja_nome,
    CASE 
        WHEN roteiro_id IS NOT NULL 
        THEN '✅ ROTEIRO VINCULADO: ' || roteiro_id::text
        ELSE '❌ ROTEIRO NÃO VINCULADO - PROBLEMA!'
    END as resultado,
    "createdAt" as criado_em
FROM ultima;

-- 3. VER QUANTAS MOVIMENTAÇÕES CADA MÁQUINA TEM NO ROTEIRO
SELECT 
    '=== CONTAGEM POR MÁQUINA NO ROTEIRO SEGUNDA 2 ===' as diagnostico;

SELECT 
    m.id as maquina_id,
    m.codigo,
    m.nome,
    l.nome as loja,
    COUNT(mov.id) as total_movimentacoes_no_roteiro,
    CASE 
        WHEN COUNT(mov.id) >= 1 THEN '✅ DEVE APARECER VERDE'
        ELSE '❌ AINDA PENDENTE'
    END as status_esperado
FROM roteiros r
JOIN roteiros_lojas rl ON rl.roteiro_id = r.id
JOIN lojas l ON l.id = rl.loja_id
JOIN maquinas m ON m."lojaId" = l.id AND m.ativo = true
LEFT JOIN movimentacoes mov ON mov."maquinaId" = m.id AND mov.roteiro_id = r.id
WHERE r.zona = 'Segunda 2'
    AND r.data = CURRENT_DATE
GROUP BY m.id, m.codigo, m.nome, l.nome
ORDER BY l.nome, m.codigo;

-- 4. VERIFICAR SE O BACKEND ESTÁ RETORNANDO CORRETAMENTE
SELECT 
    '=== SIMULAÇÃO DO QUE O BACKEND DEVE RETORNAR ===' as diagnostico;

-- Esta query simula exatamente o que o backend faz ao buscar o roteiro
WITH roteiro_id_input AS (
    SELECT id 
    FROM roteiros 
    WHERE zona = 'Segunda 2' 
        AND data = CURRENT_DATE 
    LIMIT 1
)
SELECT 
    l.id as loja_id,
    l.nome as loja_nome,
    m.id as maquina_id,
    m.codigo as maquina_codigo,
    m.nome as maquina_nome,
    COUNT(mov.id) as movimentacoes_encontradas,
    CASE 
        WHEN COUNT(mov.id) > 0 THEN true
        ELSE false
    END as atendida_deve_ser,
    CASE 
        WHEN COUNT(mov.id) > 0 THEN 'bg-green-50 border-green-300'
        ELSE 'bg-white border-gray-200'
    END as classe_css_esperada
FROM roteiro_id_input r
JOIN roteiros_lojas rl ON rl.roteiro_id = r.id
JOIN lojas l ON l.id = rl.loja_id
JOIN maquinas m ON m."lojaId" = l.id AND m.ativo = true
LEFT JOIN movimentacoes mov ON mov."maquinaId" = m.id AND mov.roteiro_id = r.id
GROUP BY l.id, l.nome, m.id, m.codigo, m.nome
ORDER BY l.nome, m.codigo;

-- ═══════════════════════════════════════════════════════════════════
-- INTERPRETAÇÃO:
--
-- ✅ TUDO OK SE:
--    - Seção 1: Últimas movimentações têm "✅ COM ROTEIRO"
--    - Seção 2: Última movimentação tem "✅ ROTEIRO VINCULADO"
--    - Seção 3: Máquinas que você fez movimentação mostram "✅ DEVE APARECER VERDE"
--    - Seção 4: Campo "atendida_deve_ser" = true para máquinas com movimentação
--
-- ❌ PROBLEMA SE:
--    - Seção 1 ou 2: Movimentações com "❌ SEM ROTEIRO"
--    - Seção 3: Máquina que você fez movimentação ainda mostra 0
--    - Isso significa que o frontend NÃO está enviando o roteiroId
-- ═══════════════════════════════════════════════════════════════════
