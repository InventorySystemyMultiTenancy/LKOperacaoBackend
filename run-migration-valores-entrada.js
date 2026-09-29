import pkg from "pg";
const { Client } = pkg;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL não configurada!");
  console.log("Configure a variável de ambiente DATABASE_URL");
  process.exit(1);
}

async function runMigration() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log("🔌 Conectando ao banco de dados...");
    await client.connect();
    console.log("✅ Conectado!");

    console.log("\n📝 Adicionando colunas de valores de entrada...");

    // Adicionar colunas
    await client.query(`
      ALTER TABLE movimentacoes 
      ADD COLUMN IF NOT EXISTS valor_entrada_fichas DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS valor_entrada_notas DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS valor_entrada_cartao DECIMAL(10,2);
    `);
    console.log("✅ Colunas adicionadas!");

    // Adicionar comentários
    console.log("\n📝 Adicionando comentários...");
    await client.query(`
      COMMENT ON COLUMN movimentacoes.valor_entrada_fichas IS 'Valor total de fichas coletadas (R$)';
    `);
    await client.query(`
      COMMENT ON COLUMN movimentacoes.valor_entrada_notas IS 'Valor total de notas inseridas na máquina (R$)';
    `);
    await client.query(`
      COMMENT ON COLUMN movimentacoes.valor_entrada_cartao IS 'Valor de pagamento digital - cartão/pix (R$)';
    `);
    console.log("✅ Comentários adicionados!");

    // Criar índices
    console.log("\n📝 Criando índices...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_movimentacoes_valor_entrada_fichas ON movimentacoes(valor_entrada_fichas);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_movimentacoes_valor_entrada_notas ON movimentacoes(valor_entrada_notas);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_movimentacoes_valor_entrada_cartao ON movimentacoes(valor_entrada_cartao);
    `);
    console.log("✅ Índices criados!");

    // Verificar
    console.log("\n🔍 Verificando colunas criadas...");
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'movimentacoes'
        AND column_name IN ('valor_entrada_fichas', 'valor_entrada_notas', 'valor_entrada_cartao')
      ORDER BY column_name;
    `);

    console.log("\n📊 Colunas encontradas:");
    result.rows.forEach((row) => {
      console.log(`  ✓ ${row.column_name} (${row.data_type})`);
    });

    console.log("\n✅ Migration concluída com sucesso!");
    console.log("🎉 Agora o backend pode usar os campos de valores de entrada!");

  } catch (error) {
    console.error("\n❌ Erro ao executar migration:", error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
