# Exemplos de Uso da API de Roteiros

Este arquivo contém exemplos práticos de como usar os endpoints de roteiros via curl e JavaScript fetch.

## 🔑 Autenticação

Primeiro, obtenha um token de autenticação:

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "senha": "senha123"
  }'
```

**Resposta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": "uuid-do-usuario",
    "nome": "Admin",
    "email": "admin@example.com"
  }
}
```

Use o token retornado em todas as requisições seguintes:
```bash
TOKEN="seu_token_aqui"
```

---

## 📋 1. Listar Roteiros

### Listar roteiros do dia atual
```bash
curl -X GET http://localhost:3000/api/roteiros \
  -H "Authorization: Bearer $TOKEN"
```

### Listar roteiros de uma data específica
```bash
curl -X GET "http://localhost:3000/api/roteiros?data=2026-01-13" \
  -H "Authorization: Bearer $TOKEN"
```

### JavaScript (fetch)
```javascript
const response = await fetch('http://localhost:3000/api/roteiros', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const roteiros = await response.json();
console.log(roteiros);
```

---

## 🎲 2. Gerar Roteiros Automáticos

### Gerar roteiros para o dia atual
```bash
curl -X POST http://localhost:3000/api/roteiros/gerar \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Gerar roteiros para uma data específica
```bash
curl -X POST http://localhost:3000/api/roteiros/gerar \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "data": "2026-01-15"
  }'
```

### JavaScript (fetch)
```javascript
const response = await fetch('http://localhost:3000/api/roteiros/gerar', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    data: '2026-01-15'
  })
});
const resultado = await response.json();
console.log(resultado);
// { message: "6 roteiros gerados com sucesso", roteiros: [...] }
```

---

## 🔍 3. Obter Detalhes de um Roteiro

```bash
ROTEIRO_ID="uuid-do-roteiro"

curl -X GET "http://localhost:3000/api/roteiros/$ROTEIRO_ID" \
  -H "Authorization: Bearer $TOKEN"
```

### JavaScript (fetch)
```javascript
const roteiroId = 'uuid-do-roteiro';
const response = await fetch(`http://localhost:3000/api/roteiros/${roteiroId}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const roteiro = await response.json();
console.log(roteiro);
/*
{
  id: "...",
  data: "2026-01-13",
  zona: "Norte",
  status: "pendente",
  totalMaquinas: 15,
  lojas: [
    {
      id: "...",
      nome: "Loja Shopping Norte",
      concluida: false,
      maquinas: [...]
    }
  ]
}
*/
```

---

## ▶️ 4. Iniciar Roteiro

```bash
ROTEIRO_ID="uuid-do-roteiro"
FUNCIONARIO_ID="uuid-do-usuario"

curl -X POST "http://localhost:3000/api/roteiros/$ROTEIRO_ID/iniciar" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "funcionarioId": "'$FUNCIONARIO_ID'",
    "funcionarioNome": "João Silva"
  }'
```

### JavaScript (fetch)
```javascript
const response = await fetch(`http://localhost:3000/api/roteiros/${roteiroId}/iniciar`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    funcionarioId: 'uuid-do-usuario',
    funcionarioNome: 'João Silva'
  })
});
const resultado = await response.json();
console.log(resultado);
// { message: "Roteiro iniciado com sucesso", roteiro: {...} }
```

---

## 🔧 5. Buscar Máquinas de uma Loja

### Sem última movimentação
```bash
LOJA_ID="uuid-da-loja"

curl -X GET "http://localhost:3000/api/maquinas?lojaId=$LOJA_ID" \
  -H "Authorization: Bearer $TOKEN"
```

### Com última movimentação
```bash
curl -X GET "http://localhost:3000/api/maquinas?lojaId=$LOJA_ID&incluirUltimaMovimentacao=true" \
  -H "Authorization: Bearer $TOKEN"
```

### JavaScript (fetch)
```javascript
const lojaId = 'uuid-da-loja';
const response = await fetch(
  `http://localhost:3000/api/maquinas?lojaId=${lojaId}&incluirUltimaMovimentacao=true`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);
const maquinas = await response.json();
console.log(maquinas);
/*
[
  {
    id: "...",
    codigo: "MAQ-001",
    nome: "Máquina A",
    ultimaMovimentacao: {
      id: "...",
      roteiroId: "...",
      dataColeta: "2026-01-13"
    }
  }
]
*/
```

---

## 📝 6. Criar Movimentação (vinculada ao roteiro)

```bash
MAQUINA_ID="uuid-da-maquina"
ROTEIRO_ID="uuid-do-roteiro"

curl -X POST http://localhost:3000/api/movimentacoes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "maquinaId": "'$MAQUINA_ID'",
    "roteiroId": "'$ROTEIRO_ID'",
    "totalPre": 20,
    "sairam": 5,
    "abastecidas": 30,
    "fichas": 150,
    "contadorIn": 1000,
    "contadorOut": 500,
    "quantidade_notas_entrada": 10,
    "valor_entrada_maquininha_pix": 50.00,
    "observacoes": "Tudo ok"
  }'
```

### JavaScript (fetch)
```javascript
const response = await fetch('http://localhost:3000/api/movimentacoes', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    maquinaId: 'uuid-da-maquina',
    roteiroId: 'uuid-do-roteiro',
    totalPre: 20,
    sairam: 5,
    abastecidas: 30,
    fichas: 150,
    contadorIn: 1000,
    contadorOut: 500,
    quantidade_notas_entrada: 10,
    valor_entrada_maquininha_pix: 50.00,
    observacoes: 'Tudo ok'
  })
});
const movimentacao = await response.json();
console.log(movimentacao);

// O contador maquinasConcluidas do roteiro será atualizado automaticamente!
```

---

## ✅ 7. Concluir Loja no Roteiro

```bash
ROTEIRO_ID="uuid-do-roteiro"
LOJA_ID="uuid-da-loja"

curl -X POST "http://localhost:3000/api/roteiros/$ROTEIRO_ID/lojas/$LOJA_ID/concluir" \
  -H "Authorization: Bearer $TOKEN"
```

### JavaScript (fetch)
```javascript
const response = await fetch(
  `http://localhost:3000/api/roteiros/${roteiroId}/lojas/${lojaId}/concluir`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);
const resultado = await response.json();
console.log(resultado);
/*
{
  message: "Loja concluída com sucesso",
  lojasConcluidas: 1,
  totalLojas: 5,
  roteiroCompleto: false
}
*/
```

---

## 🏁 8. Concluir Roteiro Completo

```bash
ROTEIRO_ID="uuid-do-roteiro"

curl -X POST "http://localhost:3000/api/roteiros/$ROTEIRO_ID/concluir" \
  -H "Authorization: Bearer $TOKEN"
```

### JavaScript (fetch)
```javascript
const response = await fetch(`http://localhost:3000/api/roteiros/${roteiroId}/concluir`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const resultado = await response.json();

if (response.ok) {
  console.log(resultado);
  // { message: "Roteiro concluído com sucesso", roteiro: {...} }
} else {
  console.error(resultado);
  // { error: "Ainda existem X lojas pendentes neste roteiro" }
}
```

---

## 📱 Exemplo Completo: Fluxo Frontend

```javascript
// 1. Login
async function login(email, senha) {
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha })
  });
  const data = await response.json();
  return data.token;
}

// 2. Listar roteiros do dia
async function listarRoteiros(token) {
  const response = await fetch('http://localhost:3000/api/roteiros', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await response.json();
}

// 3. Iniciar roteiro
async function iniciarRoteiro(token, roteiroId, funcionarioNome) {
  const response = await fetch(`http://localhost:3000/api/roteiros/${roteiroId}/iniciar`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ funcionarioNome })
  });
  return await response.json();
}

// 4. Criar movimentação
async function criarMovimentacao(token, dados) {
  const response = await fetch('http://localhost:3000/api/movimentacoes', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(dados)
  });
  return await response.json();
}

// 5. Concluir loja
async function concluirLoja(token, roteiroId, lojaId) {
  const response = await fetch(
    `http://localhost:3000/api/roteiros/${roteiroId}/lojas/${lojaId}/concluir`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  return await response.json();
}

// Uso
async function executarFluxo() {
  try {
    // 1. Fazer login
    const token = await login('admin@example.com', 'senha123');
    console.log('✅ Login realizado');

    // 2. Listar roteiros
    const roteiros = await listarRoteiros(token);
    console.log('✅ Roteiros:', roteiros.length);

    if (roteiros.length === 0) {
      console.log('Nenhum roteiro encontrado. Gerando...');
      await fetch('http://localhost:3000/api/roteiros/gerar', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }

    // 3. Iniciar primeiro roteiro
    const roteiro = roteiros[0];
    await iniciarRoteiro(token, roteiro.id, 'João Silva');
    console.log('✅ Roteiro iniciado');

    // 4. Criar movimentação para primeira máquina
    const primeiraLoja = roteiro.lojas[0];
    const primeiraMaquina = primeiraLoja.maquinas[0];

    await criarMovimentacao(token, {
      maquinaId: primeiraMaquina.id,
      roteiroId: roteiro.id,
      totalPre: 20,
      sairam: 5,
      abastecidas: 30,
      fichas: 150
    });
    console.log('✅ Movimentação criada');

    // 5. Concluir loja
    await concluirLoja(token, roteiro.id, primeiraLoja.id);
    console.log('✅ Loja concluída');

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}
```

---

## 🔄 Testando com Postman

### Coleção de Requests

1. **Criar variável de ambiente:**
   - `baseUrl`: `http://localhost:3000/api`
   - `token`: (será preenchido após login)

2. **Importar requests:**

```json
{
  "info": {
    "name": "Roteiros API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "1. Login",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/auth/login",
        "body": {
          "mode": "raw",
          "raw": "{\"email\":\"admin@example.com\",\"senha\":\"senha123\"}"
        }
      }
    },
    {
      "name": "2. Listar Roteiros",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/roteiros",
        "header": [{"key":"Authorization","value":"Bearer {{token}}"}]
      }
    },
    {
      "name": "3. Gerar Roteiros",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/roteiros/gerar",
        "header": [{"key":"Authorization","value":"Bearer {{token}}"}]
      }
    }
  ]
}
```

---

## 💡 Dicas

1. **Sempre autentique primeiro** - Todos os endpoints requerem token
2. **Verifique zonas nas lojas** - Lojas precisam ter zona para serem incluídas nos roteiros
3. **Use incluirUltimaMovimentacao** - Para saber se uma máquina já foi processada
4. **Monitore maquinasConcluidas** - Atualizado automaticamente ao criar movimentações
5. **Conclua lojas antes do roteiro** - Não é possível finalizar roteiro com lojas pendentes
