-- ═══════════════════════════════════════════════════════════════════
-- DIAGNÓSTICO DE COMISSÃO - VERSÃO CORRIGIDA COM NOMES DO BANCO
-- Execute estas queries para descobrir por que a comissão retorna vazia
-- ═══════════════════════════════════════════════════════════════════

-- 🔍 QUERY 1: VERIFICAR SE A LOJA FOI CONCLUÍDA E SE TEM VALORES FINANCEIROS
SELECT 
    '=== VERIFICAÇÃO COMPLETA DA LOJA MATEUS CRUZ ===' as diagnostico;

SELECT 
    r.zona,
    l.nome as loja_nome,
    rl.concluida as loja_concluida,
    m.codigo as maquina_codigo,
    m.percentual_comissao,
    mov.valor_entrada_fichas,
    mov.valor_entrada_notas,
    mov.valor_entrada_cartao,
    mov.numero_bag,
    mov.status_financeiro,
    mov."createdAt" as movimento_criado_em
FROM roteiros r
JOIN roteiros_lojas rl ON rl.roteiro_id = r.id
JOIN lojas l ON l.id = rl.loja_id
LEFT JOIN maquinas m ON m."lojaId" = l.id
LEFT JOIN movimentacoes mov ON mov."maquinaId" = m.id AND mov.roteiro_id = r.id
WHERE l.nome = 'Mateus Cruz' 
    AND r.data = CURRENT_DATE
ORDER BY m.codigo;

-- 🔍 QUERY 2: VERIFICAR SE JÁ EXISTE COMISSÃO CALCULADA
SELECT 
    '=== COMISSÕES EXISTENTES PARA MATEUS CRUZ ===' as diagnostico;

SELECT 
    c.id,
    l.nome as loja_nome,
    r.zona as roteiro_zona,
    c.data_calculo,
    c.total_lucro,
    c.total_comissao,
    c.detalhes
FROM comissoes_lojas c
JOIN lojas l ON l.id = c.loja_id
LEFT JOIN roteiros r ON r.id = c.roteiro_id
WHERE l.nome = 'Mateus Cruz'
ORDER BY c.data_calculo DESC
LIMIT 5;

-- 🔍 QUERY 3: SIMULAR O CÁLCULO DE COMISSÃO (VER O QUE DEVERIA SER CALCULADO)
SELECT 
    '=== SIMULAÇÃO DO CÁLCULO DE COMISSÃO ===' as diagnostico;

WITH valores_movimento AS (
    SELECT 
        m.id as maquina_id,
        m.codigo,
        m.percentual_comissao,
        COALESCE(mov.valor_entrada_fichas, 0) as fichas,
        COALESCE(mov.valor_entrada_notas, 0) as notas,
        COALESCE(mov.valor_entrada_cartao, 0) as cartao,
        -- Custo dos produtos (calculado via soma de produtos * custoUnitario)
        COALESCE(
            (SELECT SUM(mp."quantidadeSaiu" * p."custoUnitario")
             FROM movimentacao_produtos mp
             JOIN produtos p ON p.id = mp."produtoId"
             WHERE mp."movimentacaoId" = mov.id), 0
        ) as custo_produtos
    FROM roteiros r
    JOIN roteiros_lojas rl ON rl.roteiro_id = r.id
    JOIN lojas l ON l.id = rl.loja_id
    JOIN maquinas m ON m."lojaId" = l.id
    LEFT JOIN movimentacoes mov ON mov."maquinaId" = m.id AND mov.roteiro_id = r.id
    WHERE l.nome = 'Mateus Cruz'
        AND r.data = CURRENT_DATE
        AND rl.concluida = true
        AND m.percentual_comissao > 0
)
SELECT 
    codigo as maquina,
    percentual_comissao as "comissao_%",
    fichas,
    notas,
    cartao,
    (fichas + notas + cartao) as receita_total,
    custo_produtos,
    (fichas + notas + cartao - custo_produtos) as lucro,
    ROUND(((fichas + notas + cartao - custo_produtos) * percentual_comissao / 100)::numeric, 2) as comissao_calculada
FROM valores_movimento;

-- 🔍 QUERY 4: VERIFICAR STATUS FINANCEIRO E VALORES
SELECT 
    '=== STATUS FINANCEIRO DA MOVIMENTAÇÃO ===' as diagnostico;

SELECT 
    m.codigo as maquina,
    mov.status_financeiro,
    mov.numero_bag,
    mov.valor_entrada_fichas,
    mov.valor_entrada_notas,
    mov.valor_entrada_cartao,
    COALESCE(mov.valor_entrada_fichas, 0) + 
    COALESCE(mov.valor_entrada_notas, 0) + 
    COALESCE(mov.valor_entrada_cartao, 0) as receita_total,
    CASE 
        WHEN mov.numero_bag IS NOT NULL THEN '⚠️ TEM BAG - VALORES PENDENTES DE PREENCHIMENTO'
        WHEN mov.status_financeiro = 'pendente' THEN '⚠️ STATUS PENDENTE - VALORES NÃO PREENCHIDOS'
        WHEN mov.status_financeiro = 'concluido' AND (
            COALESCE(mov.valor_entrada_fichas, 0) + 
            COALESCE(mov.valor_entrada_notas, 0) + 
            COALESCE(mov.valor_entrada_cartao, 0)
        ) > 0 THEN '✅ STATUS CONCLUÍDO - TEM VALORES FINANCEIROS'
        ELSE '❌ STATUS CONCLUÍDO MAS SEM VALORES'
    END as status_valores
FROM roteiros r
JOIN roteiros_lojas rl ON rl.roteiro_id = r.id
JOIN lojas l ON l.id = rl.loja_id
JOIN maquinas m ON m."lojaId" = l.id
LEFT JOIN movimentacoes mov ON mov."maquinaId" = m.id AND mov.roteiro_id = r.id
WHERE l.nome = 'Mateus Cruz'
    AND r.data = CURRENT_DATE;

-- ═══════════════════════════════════════════════════════════════════
-- INTERPRETAÇÃO DOS RESULTADOS:
--
-- ✅ QUERY 1 - VERIFICAÇÕES NECESSÁRIAS:
--    - rl.concluida deve ser TRUE
--    - m.percentual_comissao deve ser > 0
--    - mov.valor_entrada_fichas/notas/cartao devem ter valores (não NULL)
--
-- ✅ QUERY 2 - COMISSÕES EXISTENTES:
--    - Se aparecer comissão recente = já foi calculada (duplicata bloqueada)
--    - Se vazio = ainda não foi calculada
--
-- ✅ QUERY 3 - SIMULAÇÃO:
--    - Mostra exatamente quanto deveria ser calculado
--    - Se aparecer vazio = loja não concluída OU máquina sem comissão
--    - Se aparecer valor = isso é o que deveria ser salvo
--
-- ✅ QUERY 4 - STATUS FINANCEIRO:
--    - Se numero_bag preenchido = valores pendentes (aguardando preenchimento)
--    - Se status_financeiro = 'pendente' = valores não preenchidos
--    - Se status_financeiro = 'concluido' E valores > 0 = pode calcular comissão
--    - COMISSÃO SÓ É CALCULADA QUANDO TEM VALORES FINANCEIROS PREENCHIDOS
-- ═══════════════════════════════════════════════════════════════════
