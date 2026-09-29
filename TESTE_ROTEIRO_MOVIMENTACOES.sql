-- ============================================
-- SCRIPT DE TESTE PARA ROTEIROS E MOVIMENTAÇÕES
-- Execute cada seção separadamente no DBeaver
-- ============================================

-- PASSO 1: Verificar roteiros existentes
SELECT 
    id,
    nome,
    zona,
    data,
    status,
    funcionarioId,
    funcionarioNome
FROM roteiros
ORDER BY data DESC, id DESC
LIMIT 10;

-- PASSO 2: Ver detalhes de um roteiro específico (SUBSTITUA o ID)
-- IMPORTANTE: Substitua 'SEU_ROTEIRO_ID' pelo ID do roteiro que você está testando
SET @roteiro_id = 1; -- <<< ALTERE AQUI para o ID do seu roteiro

SELECT 
    r.id as roteiro_id,
    r.nome as roteiro_nome,
    r.status,
    r.data,
    rl.lojaId,
    l.nome as loja_nome,
    rl.concluida as loja_concluida,
    rl.ordem
FROM roteiros r
LEFT JOIN roteiros_lojas rl ON r.id = rl.roteiroId
LEFT JOIN lojas l ON rl.lojaId = l.id
WHERE r.id = @roteiro_id
ORDER BY rl.ordem;

-- PASSO 3: Ver máquinas de uma loja específica
-- IMPORTANTE: Substitua 'SUA_LOJA_ID' pelo ID da loja que você está testando
SET @loja_id = 1; -- <<< ALTERE AQUI para o ID da sua loja

SELECT 
    m.id,
    m.codigo,
    m.nome,
    m.tipo,
    m.lojaId,
    m.ativo,
    l.nome as loja_nome
FROM maquinas m
LEFT JOIN lojas l ON m.lojaId = l.id
WHERE m.lojaId = @loja_id
AND m.ativo = true
ORDER BY m.codigo;

-- PASSO 4: Verificar movimentações do roteiro
-- Esta é a QUERY CRÍTICA que mostra se as movimentações estão sendo registradas
SELECT 
    mov.id as movimentacao_id,
    mov.roteiroId,
    mov.maquinaId,
    m.codigo as maquina_codigo,
    m.nome as maquina_nome,
    l.nome as loja_nome,
    mov.dataColeta,
    mov.totalPre,
    mov.sairam,
    mov.abastecidas,
    mov.totalPos,
    mov.fichas,
    mov.valorFaturado,
    mov.createdAt
FROM movimentacoes mov
LEFT JOIN maquinas m ON mov.maquinaId = m.id
LEFT JOIN lojas l ON m.lojaId = l.id
WHERE mov.roteiroId = @roteiro_id
ORDER BY mov.createdAt DESC;

-- PASSO 5: Verificar quais máquinas do roteiro JÁ TÊM movimentação (limite 1)
-- Esta query mostra se cada máquina atingiu o limite de 1 movimentação
SELECT 
    m.id as maquina_id,
    m.codigo,
    m.nome,
    m.lojaId,
    l.nome as loja_nome,
    CASE 
        WHEN mov.maquinaId IS NOT NULL THEN 'SIM - Atendida (1/1)'
        ELSE 'NÃO - Pendente (0/1)'
    END as tem_movimentacao,
    mov.id as movimentacao_id,
    mov.dataColeta
FROM maquinas m
LEFT JOIN lojas l ON m.lojaId = l.id
LEFT JOIN roteiros_lojas rl ON l.id = rl.lojaId AND rl.roteiroId = @roteiro_id
LEFT JOIN movimentacoes mov ON m.id = mov.maquinaId AND mov.roteiroId = @roteiro_id
WHERE rl.roteiroId = @roteiro_id
AND m.ativo = true
ORDER BY l.nome, m.codigo;

-- PASSO 6: Contagem de máquinas atendidas vs total
SELECT 
    l.id as loja_id,
    l.nome as loja_nome,
    COUNT(DISTINCT m.id) as total_maquinas,
    COUNT(DISTINCT mov.maquinaId) as maquinas_com_movimentacao,
    COUNT(DISTINCT m.id) - COUNT(DISTINCT mov.maquinaId) as maquinas_pendentes,
    CASE 
        WHEN COUNT(DISTINCT m.id) = COUNT(DISTINCT mov.maquinaId) 
        THEN '✅ TODAS ATENDIDAS - Pode concluir loja'
        ELSE '⏳ PENDENTE - Faltam máquinas'
    END as status_loja,
    rl.concluida as loja_marcada_concluida
FROM lojas l
LEFT JOIN roteiros_lojas rl ON l.id = rl.lojaId AND rl.roteiroId = @roteiro_id
LEFT JOIN maquinas m ON l.id = m.lojaId AND m.ativo = true
LEFT JOIN movimentacoes mov ON m.id = mov.maquinaId AND mov.roteiroId = @roteiro_id
WHERE rl.roteiroId = @roteiro_id
GROUP BY l.id, l.nome, rl.concluida
ORDER BY l.nome;

-- PASSO 7: Resumo geral do roteiro (DEVE BATER COM O FRONTEND)
SELECT 
    r.id as roteiro_id,
    r.nome as roteiro_nome,
    r.status,
    COUNT(DISTINCT rl.lojaId) as total_lojas,
    SUM(CASE WHEN rl.concluida = true THEN 1 ELSE 0 END) as lojas_concluidas,
    COUNT(DISTINCT m.id) as total_maquinas,
    COUNT(DISTINCT mov.maquinaId) as maquinas_com_movimentacao,
    COUNT(DISTINCT m.id) - COUNT(DISTINCT mov.maquinaId) as maquinas_pendentes,
    CASE 
        WHEN COUNT(DISTINCT m.id) = COUNT(DISTINCT mov.maquinaId) 
        THEN '✅ PODE CONCLUIR ROTEIRO'
        ELSE '⏳ FALTAM MÁQUINAS'
    END as pode_concluir_roteiro
FROM roteiros r
LEFT JOIN roteiros_lojas rl ON r.id = rl.roteiroId
LEFT JOIN maquinas m ON rl.lojaId = m.lojaId AND m.ativo = true
LEFT JOIN movimentacoes mov ON m.id = mov.maquinaId AND mov.roteiroId = r.id
WHERE r.id = @roteiro_id
GROUP BY r.id, r.nome, r.status;

-- PASSO 8: Verificar se há problema com IDs duplicados ou movimentações órfãs
SELECT 
    'Movimentações sem roteiro' as problema,
    COUNT(*) as quantidade
FROM movimentacoes
WHERE roteiroId IS NULL
UNION ALL
SELECT 
    'Movimentações com roteiro inexistente' as problema,
    COUNT(*) as quantidade
FROM movimentacoes mov
LEFT JOIN roteiros r ON mov.roteiroId = r.id
WHERE mov.roteiroId IS NOT NULL AND r.id IS NULL
UNION ALL
SELECT 
    'Movimentações com máquina inexistente' as problema,
    COUNT(*) as quantidade
FROM movimentacoes mov
LEFT JOIN maquinas m ON mov.maquinaId = m.id
WHERE m.id IS NULL;

-- PASSO 9: Ver última movimentação criada (debug)
SELECT 
    mov.*,
    m.codigo,
    m.nome,
    l.nome as loja_nome
FROM movimentacoes mov
LEFT JOIN maquinas m ON mov.maquinaId = m.id
LEFT JOIN lojas l ON m.lojaId = l.id
ORDER BY mov.createdAt DESC
LIMIT 5;

-- PASSO 10: Testar se o problema está na contagem
-- Esta query DEVE retornar o mesmo resultado que o backend
SELECT 
    m.id,
    m.codigo,
    m.nome,
    EXISTS (
        SELECT 1 
        FROM movimentacoes mov 
        WHERE mov.maquinaId = m.id 
        AND mov.roteiroId = @roteiro_id
    ) as atendida
FROM maquinas m
WHERE m.lojaId = @loja_id
AND m.ativo = true
ORDER BY m.codigo;
