-- Script para popular dados de teste para o sistema de roteiros
-- Execute este script após a migration para ter dados de teste

-- 1. Atualizar lojas existentes com zonas (adapte os IDs conforme necessário)
-- Exemplo: UPDATE lojas SET zona = 'Norte' WHERE id IN ('uuid1', 'uuid2');

-- Primeiro, veja as lojas existentes
SELECT id, nome, cidade, estado, zona FROM lojas ORDER BY cidade;

-- Depois, atualize conforme a localização real
-- Norte
UPDATE lojas SET zona = 'Norte' 
WHERE cidade IN ('Santana', 'Tucuruvi', 'Vila Guilherme', 'Jaçanã');

-- Sul
UPDATE lojas SET zona = 'Sul' 
WHERE cidade IN ('Santo Amaro', 'Jabaquara', 'Vila Mariana', 'Ipiranga');

-- Leste
UPDATE lojas SET zona = 'Leste' 
WHERE cidade IN ('Tatuapé', 'Penha', 'Vila Matilde', 'Itaquera');

-- Oeste
UPDATE lojas SET zona = 'Oeste' 
WHERE cidade IN ('Pinheiros', 'Butantã', 'Lapa', 'Osasco');

-- Centro
UPDATE lojas SET zona = 'Centro' 
WHERE cidade IN ('Sé', 'República', 'Centro', 'Consolação');

-- 2. Verificar distribuição
SELECT zona, COUNT(*) as total_lojas 
FROM lojas 
WHERE ativo = true 
GROUP BY zona;

-- 3. Ver lojas sem zona definida
SELECT id, nome, cidade, estado 
FROM lojas 
WHERE zona IS NULL AND ativo = true;

-- 4. Exemplo de criação manual de um roteiro de teste
INSERT INTO roteiros (
  id, data, zona, estado, cidade, status, 
  "funcionarioNome", "totalMaquinas", "maquinasConcluidas", 
  "saldoRestante", "createdAt", "updatedAt"
)
VALUES (
  gen_random_uuid(),
  CURRENT_DATE,
  'Norte',
  'SP',
  'São Paulo',
  'pendente',
  'Funcionário Teste',
  0,
  0,
  500.00,
  NOW(),
  NOW()
);

-- 5. Verificar roteiros criados
SELECT 
  r.id,
  r.data,
  r.zona,
  r.status,
  r."funcionarioNome",
  r."totalMaquinas",
  r."maquinasConcluidas",
  COUNT(rl.id) as lojas_associadas
FROM roteiros r
LEFT JOIN roteiros_lojas rl ON r.id = rl.roteiro_id
GROUP BY r.id
ORDER BY r.data DESC;

-- 6. Ver detalhes de roteiros com lojas
SELECT 
  r.id as roteiro_id,
  r.zona,
  r.status,
  l.nome as loja_nome,
  l.cidade,
  rl.concluida,
  rl.ordem,
  COUNT(m.id) as total_maquinas
FROM roteiros r
INNER JOIN roteiros_lojas rl ON r.id = rl.roteiro_id
INNER JOIN lojas l ON rl.loja_id = l.id
LEFT JOIN maquinas m ON l.id = m."lojaId" AND m.ativo = true
WHERE r.data = CURRENT_DATE
GROUP BY r.id, r.zona, r.status, l.nome, l.cidade, rl.concluida, rl.ordem
ORDER BY r.zona, rl.ordem;

-- 7. Ver movimentações vinculadas a roteiros
SELECT 
  r.id as roteiro_id,
  r.zona,
  r."maquinasConcluidas",
  COUNT(DISTINCT m.id) as movimentacoes_registradas,
  COUNT(DISTINCT m."maquinaId") as maquinas_unicas
FROM roteiros r
LEFT JOIN movimentacoes m ON r.id = m.roteiro_id
WHERE r.data = CURRENT_DATE
GROUP BY r.id, r.zona, r."maquinasConcluidas";

-- 8. Limpar dados de teste (caso necessário)
-- CUIDADO: Isso remove todos os roteiros!
-- DELETE FROM roteiros_gastos;
-- DELETE FROM roteiros_lojas;
-- DELETE FROM movimentacoes WHERE roteiro_id IS NOT NULL;
-- DELETE FROM roteiros;

-- 9. Resetar zonas (caso necessário)
-- UPDATE lojas SET zona = NULL;
