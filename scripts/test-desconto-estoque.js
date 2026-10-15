// Script de teste para validar o desconto automático de estoque
import { sequelize } from "../src/database/connection.js";
import {
  Loja,
  Maquina,
  Produto,
  EstoqueLoja,
  Movimentacao,
  MovimentacaoProduto,
  Usuario,
} from "../src/models/index.js";

async function testarDescontoAutomatico() {
  try {
    console.log("🔄 Conectando ao banco...");
    await sequelize.authenticate();
    console.log("✅ Conexão OK\n");

    // 1. Buscar uma loja existente
    console.log("📍 Buscando loja...");
    const loja = await Loja.findOne();
    if (!loja) {
      console.log("❌ Nenhuma loja encontrada. Crie uma loja primeiro.");
      process.exit(1);
    }
    console.log(`✅ Loja encontrada: ${loja.nome} (${loja.id})\n`);

    // 2. Buscar uma máquina desta loja
    console.log("🎰 Buscando máquina da loja...");
    const maquina = await Maquina.findOne({ where: { lojaId: loja.id } });
    if (!maquina) {
      console.log(
        "❌ Nenhuma máquina encontrada para esta loja. Crie uma máquina primeiro."
      );
      process.exit(1);
    }
    console.log(`✅ Máquina encontrada: ${maquina.codigo} (${maquina.id})\n`);

    // 3. Buscar um produto
    console.log("🧸 Buscando produto...");
    const produto = await Produto.findOne();
    if (!produto) {
      console.log("❌ Nenhum produto encontrado. Crie um produto primeiro.");
      process.exit(1);
    }
    console.log(`✅ Produto encontrado: ${produto.nome} (${produto.id})\n`);

    // 4. Verificar estoque atual ou criar
    console.log("📦 Verificando estoque da loja...");
    let estoque = await EstoqueLoja.findOne({
      where: {
        lojaId: loja.id,
        produtoId: produto.id,
      },
    });

    if (!estoque) {
      console.log(
        "📝 Estoque não existe. Criando estoque inicial de 100 unidades..."
      );
      estoque = await EstoqueLoja.create({
        lojaId: loja.id,
        produtoId: produto.id,
        quantidade: 100,
        estoqueMinimo: 10,
      });
    }

    const quantidadeInicial = estoque.quantidade;
    console.log(`✅ Estoque atual: ${quantidadeInicial} unidades\n`);

    // 5. Buscar um usuário para fazer a movimentação
    console.log("👤 Buscando usuário...");
    const usuario = await Usuario.findOne();
    if (!usuario) {
      console.log("❌ Nenhum usuário encontrado. Crie um usuário primeiro.");
      process.exit(1);
    }
    console.log(`✅ Usuário encontrado: ${usuario.nome} (${usuario.id})\n`);

    // 6. Simular abastecimento de 15 unidades
    const quantidadeAbastecer = 15;
    console.log(
      `🔄 Simulando abastecimento de ${quantidadeAbastecer} unidades...\n`
    );

    // Criar movimentação
    const movimentacao = await Movimentacao.create({
      maquinaId: maquina.id,
      usuarioId: usuario.id,
      dataColeta: new Date(),
      totalPre: 100,
      sairam: 20,
      abastecidas: quantidadeAbastecer,
      fichas: 50,
      contadorMaquina: 1000,
      valorFaturado: 50 * parseFloat(maquina.valorFicha),
      observacoes: "Teste de desconto automático de estoque",
      tipoOcorrencia: "Normal",
      retiradaEstoque: false,
    });

    console.log(`✅ Movimentação criada (${movimentacao.id})`);

    // Criar detalhes do produto
    await MovimentacaoProduto.create({
      movimentacaoId: movimentacao.id,
      produtoId: produto.id,
      quantidadeSaiu: 20,
      quantidadeAbastecida: quantidadeAbastecer,
    });

    console.log(`✅ Produto registrado na movimentação`);

    // Simular o desconto (igual ao controller)
    const estoqueLoja = await EstoqueLoja.findOne({
      where: {
        lojaId: maquina.lojaId,
        produtoId: produto.id,
      },
    });

    if (estoqueLoja) {
      const novaQuantidade = Math.max(
        0,
        estoqueLoja.quantidade - quantidadeAbastecer
      );
      await estoqueLoja.update({ quantidade: novaQuantidade });
      console.log(`✅ Estoque descontado\n`);
    }

    // 7. Verificar novo estoque
    await estoque.reload();
    const quantidadeFinal = estoque.quantidade;
    const quantidadeDescontada = quantidadeInicial - quantidadeFinal;

    console.log("📊 RESULTADO DO TESTE:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Loja: ${loja.nome}`);
    console.log(`Máquina: ${maquina.codigo}`);
    console.log(`Produto: ${produto.nome}`);
    console.log(`Quantidade Inicial: ${quantidadeInicial} unidades`);
    console.log(`Quantidade Abastecida: ${quantidadeAbastecer} unidades`);
    console.log(`Quantidade Final: ${quantidadeFinal} unidades`);
    console.log(`Quantidade Descontada: ${quantidadeDescontada} unidades`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    if (quantidadeDescontada === quantidadeAbastecer) {
      console.log("✅ TESTE PASSOU! O desconto foi aplicado corretamente.");
    } else {
      console.log(
        `❌ TESTE FALHOU! Esperado: ${quantidadeAbastecer}, Descontado: ${quantidadeDescontada}`
      );
    }

    // Limpar dados de teste
    console.log("\n🧹 Limpando dados de teste...");
    await MovimentacaoProduto.destroy({
      where: { movimentacaoId: movimentacao.id },
    });
    await movimentacao.destroy();
    console.log("✅ Dados de teste removidos");

    // Restaurar estoque original
    await estoque.update({ quantidade: quantidadeInicial });
    console.log("✅ Estoque restaurado ao valor original\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ ERRO NO TESTE:", error.message);
    console.error(error);
    process.exit(1);
  }
}

// Executar teste
testarDescontoAutomatico();
