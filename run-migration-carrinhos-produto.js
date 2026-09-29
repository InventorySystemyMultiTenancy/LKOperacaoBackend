/**
 * Script para executar migration de carrinhos por produto
 * 
 * Adiciona as tabelas necessárias para controle de produtos individuais nos carrinhos
 * 
 * Execute: node run-migration-carrinhos-produto.js
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Configuração do banco de dados
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Erro: A variável de ambiente DATABASE_URL não está definida');
  console.log('\n📝 Configure usando:');
  console.log('   export DATABASE_URL="postgresql://usuario:senha@host:porta/database"');
  console.log('   ou');
  console.log('   set DATABASE_URL=postgresql://usuario:senha@host:porta/database');
  process.exit(1);
}

// Criar pool de conexão
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Conectando ao banco de dados...');
    
    // Ler o arquivo SQL
    const migrationPath = path.join(__dirname, 'MIGRATION_CARRINHOS_POR_PRODUTO.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📋 Executando migration...\n');
    
    // Executar a migration dentro de uma transação
    await client.query('BEGIN');
    
    try {
      // Executar o SQL
      const result = await client.query(migrationSQL);
      
      await client.query('COMMIT');
      
      console.log('✅ Migration executada com sucesso!');
      console.log('\n📊 Tabelas criadas:');
      console.log('   ✓ carrinho_itens - Produtos individuais em cada carrinho');
      console.log('   ✓ devolucao_carrinho_itens - Produtos individuais em cada devolução');
      console.log('\n📝 Próximas etapas:');
      console.log('   1. Faça commit das alterações no código');
      console.log('   2. Faça push para o repositório');
      console.log('   3. Aguarde o deploy automático no Render (ou faça deploy manual)');
      console.log('   4. Teste as novas funcionalidades');
      console.log('\n📖 Consulte SISTEMA_CARRINHOS_POR_PRODUTO.md para mais informações');
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Erro ao executar migration:', error.message);
    console.error('\n🔍 Detalhes do erro:', error);
    process.exit(1);
    
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar
console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║    MIGRATION: Carrinhos por Produto Individual          ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

runMigration();
