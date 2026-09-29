-- ============================================
-- SCRIPT PARA CRIAR MOVIMENTAÇÃO DE TESTE
-- Use este script se precisar testar manualmente
-- ============================================

-- IMPORTANTE: Ajuste os IDs conforme seu banco de dados

-- 1. Primeiro, veja quais são os IDs disponíveis
SELECT 'ROTEIROS DISPONÍVEIS:' as info;
SELECT id, nome, zona, data, status FROM roteiros ORDER BY id DESC LIMIT 5;

SELECT 'LOJAS DISPONÍVEIS:' as info;
SELECT id, nome, cidade FROM lojas ORDER BY id LIMIT 5;

SELECT 'MÁQUINAS ATIVAS:' as info;
SELECT m.id, m.codigo, m.nome, l.nome as loja 
FROM maquinas m 
LEFT JOIN lojas l ON m.lojaId = l.id 
WHERE m.ativo = true 
ORDER BY m.id LIMIT 10;

SELECT 'USUÁRIOS:' as info;
SELECT id, nome, email, role FROM usuarios LIMIT 5;

-- 2. Criar uma movimentação de teste (AJUSTE OS IDs)
-- Substitua os valores conforme seu ambiente:
-- @roteiro_id = ID do roteiro que você está testando
-- @maquina_id = ID de uma máquina que ainda NÃO tem movimentação
-- @usuario_id = ID do seu usuário logado

/*
-- EXEMPLO DE INSERT (DESCOMENTE E AJUSTE OS IDs):

INSERT INTO movimentacoes (
    maquinaId,
    usuarioId,
    roteiroId,
    dataColeta,
    totalPre,
    sairam,
    abastecidas,
    totalPos,
    fichas,
    contadorIn,
    contadorOut,
    valorFaturado,
    observacoes,
    tipoOcorrencia,
    retiradaEstoque,
    statusFinanceiro,
    createdAt,
    updatedAt
) VALUES (
    1,              -- maquinaId - AJUSTE AQUI
    1,              -- usuarioId - AJUSTE AQUI  
    1,              -- roteiroId - AJUSTE AQUI
    NOW(),          -- dataColeta
    50,             -- totalPre
    10,             -- sairam
    20,             -- abastecidas
    60,             -- totalPos (calculado: 50 - 10 + 20)
    15,             -- fichas
    100,            -- contadorIn
    150,            -- contadorOut
    37.50,          -- valorFaturado (15 fichas * R$ 2.50)
    'Teste manual',  -- observacoes
    'Normal',       -- tipoOcorrencia
    false,          -- retiradaEstoque
    'concluido',    -- statusFinanceiro
    NOW(),
    NOW()
);

-- Verificar se foi criado:
SELECT * FROM movimentacoes ORDER BY id DESC LIMIT 1;
*/

-- 3. Verificar movimentações de um roteiro específico
SET @roteiro_id = 1; -- AJUSTE AQUI

SELECT 
    mov.id,
    mov.maquinaId,
    m.codigo,
    m.nome as maquina,
    l.nome as loja,
    mov.roteiroId,
    mov.totalPre,
    mov.sairam,
    mov.abastecidas,
    mov.totalPos,
    mov.createdAt
FROM movimentacoes mov
LEFT JOIN maquinas m ON mov.maquinaId = m.id
LEFT JOIN lojas l ON m.lojaId = l.id
WHERE mov.roteiroId = @roteiro_id
ORDER BY mov.createdAt DESC;

-- 4. Deletar movimentação de teste (se necessário)
/*
-- DESCOMENTE para deletar a última movimentação criada:
DELETE FROM movimentacoes_produtos WHERE movimentacaoId = (SELECT MAX(id) FROM movimentacoes);
DELETE FROM movimentacoes WHERE id = (SELECT MAX(id) FROM movimentacoes);
*/

-- 5. Verificar se a máquina está sendo marcada como atendida
SELECT 
    m.id,
    m.codigo,
    m.nome,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM movimentacoes 
            WHERE maquinaId = m.id AND roteiroId = @roteiro_id
        ) THEN '✅ ATENDIDA (1/1)'
        ELSE '❌ PENDENTE (0/1)'
    END as status
FROM maquinas m
WHERE m.lojaId IN (
    SELECT lojaId FROM roteiros_lojas WHERE roteiroId = @roteiro_id
)
AND m.ativo = true
ORDER BY m.codigo;
