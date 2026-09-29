-- ============================================
-- DIAGNÓSTICO: Movimentações de Veículos
-- Data: 2026-03-12
-- Objetivo: Verificar se retiradas e devoluções estão sendo registradas corretamente
-- ============================================

-- 1. CONTAR movimentações por tipo
SELECT 
  tipo,
  COUNT(*) as quantidade
FROM movimentacao_veiculos
GROUP BY tipo
ORDER BY tipo;

-- RESULTADO ESPERADO:
-- tipo      | quantidade
-- -----------+------------
-- devolucao | <numero>
-- retirada  | <numero>

-- ============================================

-- 2. LISTAR últimas 20 movimentações (todas)
SELECT 
  id,
  veiculo_id,
  usuario_id,
  tipo,
  km,
  data_movimentacao,
  gasolina,
  nivel_limpeza,
  estado
FROM movimentacao_veiculos
ORDER BY data_movimentacao DESC
LIMIT 20;

-- ============================================

-- 3. VERIFICAR movimentações de um veículo específico
-- (Substituir 'VEICULO_ID_AQUI' pelo UUID do veículo)
/*
SELECT 
  mv.id,
  mv.tipo,
  mv.km,
  mv.data_movimentacao,
  v.nome as veiculo_nome,
  u.nome as usuario_nome
FROM movimentacao_veiculos mv
LEFT JOIN veiculos v ON mv.veiculo_id = v.id
LEFT JOIN usuarios u ON mv.usuario_id = u.id
WHERE mv.veiculo_id = 'VEICULO_ID_AQUI'
ORDER BY mv.data_movimentacao DESC;
*/

-- ============================================

-- 4. VERIFICAR se há retiradas SEM devoluções correspondentes
SELECT 
  mv.id as retirada_id,
  v.nome as veiculo,
  u.nome as usuario,
  mv.km as km_retirada,
  mv.data_movimentacao as data_retirada,
  (
    SELECT COUNT(*) 
    FROM movimentacao_veiculos mv2 
    WHERE mv2.veiculo_id = mv.veiculo_id 
      AND mv2.tipo = 'devolucao' 
      AND mv2.data_movimentacao > mv.data_movimentacao
  ) as tem_devolucao
FROM movimentacao_veiculos mv
LEFT JOIN veiculos v ON mv.veiculo_id = v.id
LEFT JOIN usuarios u ON mv.usuario_id = u.id
WHERE mv.tipo = 'retirada'
ORDER BY mv.data_movimentacao DESC
LIMIT 10;

-- ============================================

-- 5. COMPARAR pares de retirada-devolução
SELECT 
  r.id as retirada_id,
  r.data_movimentacao as data_retirada,
  r.km as km_retirada,
  d.id as devolucao_id,
  d.data_movimentacao as data_devolucao,
  d.km as km_devolucao,
  (d.km - r.km) as km_rodados,
  v.nome as veiculo
FROM movimentacao_veiculos r
LEFT JOIN movimentacao_veiculos d ON 
  d.veiculo_id = r.veiculo_id 
  AND d.tipo = 'devolucao'
  AND d.data_movimentacao > r.data_movimentacao
  AND d.data_movimentacao = (
    SELECT MIN(data_movimentacao) 
    FROM movimentacao_veiculos 
    WHERE veiculo_id = r.veiculo_id 
      AND tipo = 'devolucao' 
      AND data_movimentacao > r.data_movimentacao
  )
LEFT JOIN veiculos v ON r.veiculo_id = v.id
WHERE r.tipo = 'retirada'
ORDER BY r.data_movimentacao DESC
LIMIT 10;

-- ============================================
-- 6. VERIFICAR estrutura da tabela
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'movimentacao_veiculos'
ORDER BY ordinal_position;

-- ============================================
-- INTERPRETAÇÃO DOS RESULTADOS:
-- ============================================

-- QUERY 1: 
-- Se só aparecer 'devolucao', as retiradas NÃO estão sendo criadas (BUG GRAVE)
-- Se aparecerem ambos mas frontend não mostra, o problema é no frontend

-- QUERY 2:
-- Deve mostrar mix de 'retirada' e 'devolucao'

-- QUERY 4:
-- Retiradas com tem_devolucao = 0 ainda estão "abertas" (veículo em uso)
-- Retiradas com tem_devolucao > 0 já foram devolvidas

-- QUERY 5:
-- Mostra pares completos de retirada → devolução
-- km_rodados deve ser >= 0 (se negativo, há inconsistência)

-- ============================================
-- SOLUÇÃO SE QUERY 1 MOSTRAR APENAS 'devolucao':
-- ============================================
-- Verificar no código se endpoint POST /api/movimentacao-veiculos:
-- 1. Está recebendo tipo = 'retirada' corretamente
-- 2. Não tem validação que bloqueia retiradas
-- 3. Frontend está enviando tipo correto

-- ============================================
-- ANÁLISE BACKEND:
-- ============================================
-- O endpoint GET /api/movimentacao-veiculos está CORRETO
-- Ele NÃO filtra por tipo, retorna TUDO:
/*
const movimentacoes = await MovimentacaoVeiculo.findAll({
  where,  // Sem filtro de tipo!
  include: [
    { model: Veiculo, as: "veiculo" },
    { model: Usuario, as: "usuario" }
  ],
  order: [["dataMovimentacao", "DESC"]]
});
*/

-- ============================================
-- PRÓXIMOS PASSOS:
-- ============================================
-- 1. Executar QUERY 1 para confirmar se retiradas existem no banco
-- 2. Se existirem → problema é no FRONTEND (filtro errado na UI)
-- 3. Se NÃO existirem → problema é no POST (criação não funciona)
