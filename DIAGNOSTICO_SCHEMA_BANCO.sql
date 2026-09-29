-- ═══════════════════════════════════════════════════════════════════
-- DIAGNÓSTICO - VERIFICAR SCHEMA E TABELAS NO BANCO
-- Execute isso para descobrir onde as tabelas estão
-- ═══════════════════════════════════════════════════════════════════

-- 1. VERIFICAR EM QUAL BANCO VOCÊ ESTÁ CONECTADO
SELECT current_database() as banco_atual;

-- 2. LISTAR TODOS OS SCHEMAS
SELECT schema_name 
FROM information_schema.schemata
ORDER BY schema_name;

-- 3. PROCURAR TABELAS QUE CONTENHAM "ROTEIRO" NO NOME
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables
WHERE table_name LIKE '%roteiro%'
ORDER BY table_schema, table_name;

-- 4. PROCURAR TABELAS QUE CONTENHAM "COMISS" NO NOME
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables
WHERE table_name LIKE '%comiss%'
ORDER BY table_schema, table_name;

-- 5. LISTAR TODAS AS TABELAS DO SCHEMA PUBLIC
SELECT 
    table_schema,
    table_name
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 6. SE AS TABELAS ESTIVEREM EM OUTRO SCHEMA (exemplo: "clube")
-- Descomente e ajuste as linhas abaixo:
-- SET search_path TO clube, public;
-- ou
-- SET search_path TO nome_do_schema, public;

-- ═══════════════════════════════════════════════════════════════════
-- INTERPRETAÇÃO DOS RESULTADOS:
--
-- ✅ Se as tabelas aparecerem na query 3 e 4:
--    - Veja qual schema está listado (table_schema)
--    - Se não for "public", você precisa definir o search_path
--    - Exemplo: SET search_path TO nome_do_schema, public;
--
-- ❌ Se as tabelas NÃO aparecerem:
--    - Você está conectado no banco errado
--    - As migrations não foram executadas
--    - Verifique a conexão no DBeaver
-- ═══════════════════════════════════════════════════════════════════
