/**
 * Script de teste para validar os endpoints de roteiros
 * 
 * Como usar:
 * 1. Certifique-se de que o servidor está rodando
 * 2. Atualize o TOKEN abaixo com um token válido
 * 3. Execute: node test-roteiros-endpoints.js
 */

const BASE_URL = "http://localhost:3000/api";
const TOKEN = "SEU_TOKEN_AQUI"; // Obtenha fazendo login via POST /api/auth/login

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${TOKEN}`,
};

async function testarEndpoints() {
  console.log("🧪 Iniciando testes dos endpoints de roteiros...\n");

  try {
    // 1. Listar roteiros (deve estar vazio inicialmente)
    console.log("1️⃣ Testando GET /api/roteiros");
    let response = await fetch(`${BASE_URL}/roteiros`, { headers });
    let data = await response.json();
    console.log("✅ Status:", response.status);
    console.log("📊 Roteiros encontrados:", data.length);
    console.log();

    // 2. Gerar roteiros
    console.log("2️⃣ Testando POST /api/roteiros/gerar");
    response = await fetch(`${BASE_URL}/roteiros/gerar`, {
      method: "POST",
      headers,
      body: JSON.stringify({}),
    });
    data = await response.json();
    console.log("✅ Status:", response.status);
    console.log("📋 Resposta:", data);
    console.log();

    if (!data.roteiros || data.roteiros.length === 0) {
      console.log("⚠️ Nenhum roteiro foi gerado. Verifique se há lojas ativas com zona definida.");
      return;
    }

    const roteiroId = data.roteiros[0];
    console.log(`🎯 Usando roteiro ID: ${roteiroId} para próximos testes\n`);

    // 3. Obter detalhes de um roteiro específico
    console.log("3️⃣ Testando GET /api/roteiros/:id");
    response = await fetch(`${BASE_URL}/roteiros/${roteiroId}`, { headers });
    data = await response.json();
    console.log("✅ Status:", response.status);
    console.log("📊 Roteiro:", {
      id: data.id,
      zona: data.zona,
      status: data.status,
      totalMaquinas: data.totalMaquinas,
      lojas: data.lojas?.length || 0,
    });
    console.log();

    if (!data.lojas || data.lojas.length === 0) {
      console.log("⚠️ Nenhuma loja encontrada no roteiro.");
      return;
    }

    // 4. Iniciar roteiro
    console.log("4️⃣ Testando POST /api/roteiros/:id/iniciar");
    response = await fetch(`${BASE_URL}/roteiros/${roteiroId}/iniciar`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        funcionarioNome: "João Silva (Teste)",
      }),
    });
    data = await response.json();
    console.log("✅ Status:", response.status);
    console.log("📋 Resposta:", data);
    console.log();

    const lojaId = data.lojas?.[0]?.id || (await obterPrimeiraLoja(roteiroId));

    if (!lojaId) {
      console.log("⚠️ Nenhuma loja encontrada para testar conclusão.");
      return;
    }

    // 5. Buscar máquinas de uma loja
    console.log("5️⃣ Testando GET /api/maquinas?lojaId=:id&incluirUltimaMovimentacao=true");
    response = await fetch(
      `${BASE_URL}/maquinas?lojaId=${lojaId}&incluirUltimaMovimentacao=true`,
      { headers }
    );
    data = await response.json();
    console.log("✅ Status:", response.status);
    console.log("📊 Máquinas encontradas:", data.length);
    if (data.length > 0) {
      console.log("🔧 Primeira máquina:", {
        id: data[0].id,
        codigo: data[0].codigo,
        nome: data[0].nome,
        ultimaMovimentacao: data[0].ultimaMovimentacao ? "Sim" : "Não",
      });
    }
    console.log();

    // 6. Concluir loja
    console.log("6️⃣ Testando POST /api/roteiros/:roteiroId/lojas/:lojaId/concluir");
    response = await fetch(
      `${BASE_URL}/roteiros/${roteiroId}/lojas/${lojaId}/concluir`,
      {
        method: "POST",
        headers,
      }
    );
    data = await response.json();
    console.log("✅ Status:", response.status);
    console.log("📋 Resposta:", data);
    console.log();

    // 7. Tentar concluir roteiro (deve falhar se houver lojas pendentes)
    console.log("7️⃣ Testando POST /api/roteiros/:id/concluir");
    response = await fetch(`${BASE_URL}/roteiros/${roteiroId}/concluir`, {
      method: "POST",
      headers,
    });
    data = await response.json();
    console.log("Status:", response.status);
    console.log("📋 Resposta:", data);
    console.log();

    console.log("✅ Todos os testes concluídos!");
  } catch (error) {
    console.error("❌ Erro ao executar testes:", error);
  }
}

async function obterPrimeiraLoja(roteiroId) {
  const response = await fetch(`${BASE_URL}/roteiros/${roteiroId}`, {
    headers,
  });
  const data = await response.json();
  return data.lojas?.[0]?.id;
}

// Executar testes
if (TOKEN === "SEU_TOKEN_AQUI") {
  console.log("❌ Por favor, atualize o TOKEN no início do arquivo");
  console.log("💡 Faça login em POST /api/auth/login para obter um token");
} else {
  testarEndpoints();
}
