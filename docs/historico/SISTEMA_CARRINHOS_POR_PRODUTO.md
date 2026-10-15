# 🛒 Sistema de Carrinhos por Produto Individual - Documentação Completa

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
3. [Fluxo de Uso](#fluxo-de-uso)
4. [API Endpoints](#api-endpoints)
5. [Exemplos de Requisição](#exemplos-de-requisição)
6. [Integração Frontend](#integração-frontend)

---

## 🎯 Visão Geral

O sistema de carrinhos foi atualizado para controlar **produtos individuais** ao invés de apenas uma quantidade total. Agora:

✅ **Admin cria carrinho** escolhendo quais produtos e quantidades cada funcionário leva
✅ **Movimentações descontam** automaticamente do produto específico usado
✅ **Devolução é por produto** individual no final do dia
✅ **Discrepâncias são rastreadas** por produto separadamente

---

## 🗄️ Estrutura do Banco de Dados

### Tabela: `carrinho_usuarios`
Armazena o carrinho principal (cabeçalho).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | ID único do carrinho |
| usuario_id | UUID | ID do funcionário dono do carrinho |
| quantidade_inicial | INTEGER | Soma total de produtos iniciais |
| quantidade_atual | INTEGER | Soma total de produtos restantes |
| data | DATE | Data do carrinho |
| ativo | BOOLEAN | Se o carrinho está ativo |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Data de atualização |

### **NOVA** Tabela: `carrinho_itens`
Armazena os produtos individuais de cada carrinho.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | ID único do item |
| carrinho_id | UUID | ID do carrinho (FK) |
| produto_id | UUID | ID do produto (FK) |
| quantidade_inicial | INTEGER | Quantidade inicial deste produto |
| quantidade_atual | INTEGER | Quantidade restante deste produto |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Data de atualização |

**Índice único:** `(carrinho_id, produto_id)` - Garante que cada produto aparece uma vez por carrinho.

### Tabela: `devolucoes_carrinho`
Armazena a devolução principal (cabeçalho).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | ID único da devolução |
| carrinho_id | UUID | ID do carrinho devolvido |
| usuario_id | UUID | ID do usuário que devolveu |
| quantidade_devolvida | INTEGER | Total devolvido |
| quantidade_esperada | INTEGER | Total esperado |
| discrepancia | INTEGER | Diferença (devolvida - esperada) |
| alerta_ativo | BOOLEAN | Se alerta de discrepância está ativo |
| observacao | TEXT | Observações sobre devolução |
| data_devolucao | TIMESTAMP | Data/hora da devolução |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Data de atualização |

### **NOVA** Tabela: `devolucao_carrinho_itens`
Armazena os produtos individuais devolvidos.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | ID único do item |
| devolucao_id | UUID | ID da devolução (FK) |
| produto_id | UUID | ID do produto (FK) |
| quantidade_devolvida | INTEGER | Quanto foi devolvido deste produto |
| quantidade_esperada | INTEGER | Quanto deveria sobrar |
| discrepancia | INTEGER | Diferença por produto |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Data de atualização |

**Índice único:** `(devolucao_id, produto_id)` - Garante que cada produto aparece uma vez por devolução.

---

## 🔄 Fluxo de Uso

### 1. **Admin cria carrinho com produtos específicos**
```
Admin seleciona:
- Funcionário: João Silva
- Produtos:
  * Produto A: 50 unidades
  * Produto B: 30 unidades
  * Produto C: 20 unidades
TOTAL: 100 unidades
```

### 2. **Funcionário faz movimentação e abastece máquina**
```
Movimentação na Máquina 001:
- Produtos abastecidos:
  * Produto A: 10 unidades (desconta do carrinho)
  * Produto B: 5 unidades (desconta do carrinho)

Carrinho atualizado:
- Produto A: 40 unidades (50 - 10)
- Produto B: 25 unidades (30 - 5)
- Produto C: 20 unidades (sem alteração)
TOTAL: 85 unidades
```

### 3. **Funcionário faz mais movimentações durante o dia**
```
Cada produto abastecido é descontado automaticamente
do estoque do carrinho daquele produto específico.
```

### 4. **Final do dia: Devolução por produto**
```
Funcionário informa quanto sobrou de cada produto:
- Produto A: Devolveu 35 (Esperado: 40) → -5 FALTA
- Produto B: Devolveu 25 (Esperado: 25) → OK
- Produto C: Devolveu 22 (Esperado: 20) → +2 SOBRA

Sistema gera alertas para produtos com discrepância.
```

---

## 🔌 API Endpoints

### **POST** `/api/carrinho-usuarios`
**Permissão:** Admin ou emails autorizados

**Criar carrinho com produtos individuais**

**Request Body:**
```json
{
  "usuarioId": "uuid-do-funcionario",
  "data": "2026-03-11",  // opcional, padrão: hoje
  "itens": [
    {
      "produtoId": "uuid-produto-a",
      "quantidade": 50
    },
    {
      "produtoId": "uuid-produto-b",
      "quantidade": 30
    },
    {
      "produtoId": "uuid-produto-c",
      "quantidade": 20
    }
  ]
}
```

**Response 200:**
```json
{
  "ok": true,
  "carrinho": {
    "id": "uuid-carrinho",
    "usuarioId": "uuid-funcionario",
    "quantidadeInicial": 100,
    "quantidadeAtual": 100,
    "data": "2026-03-11",
    "ativo": true,
    "usuario": {
      "id": "uuid",
      "nome": "João Silva",
      "email": "joao@example.com"
    },
    "itens": [
      {
        "id": "uuid-item-1",
        "produtoId": "uuid-produto-a",
        "quantidadeInicial": 50,
        "quantidadeAtual": 50,
        "produto": {
          "id": "uuid-produto-a",
          "nome": "Produto A",
          "preco": 10.00
        }
      },
      // ...outros itens
    ]
  },
  "mensagem": "Carrinho criado com sucesso"
}
```

---

### **GET** `/api/carrinho-usuarios`
**Permissão:** Admin ou emails autorizados

**Listar todos os carrinhos com filtros opcionais**

**Query Params:**
- `usuarioId` (opcional): Filtrar por funcionário
- `data` (opcional): Filtrar por data (formato: "YYYY-MM-DD")
- ` ativo` (opcional): "true" ou "false"

**Response 200:**
```json
{
  "ok": true,
  "carrinhos": [
    {
      "id": "uuid",
      "usuarioId": "uuid",
      "quantidadeInicial": 100,
      "quantidadeAtual": 85,
      "data": "2026-03-11",
      "ativo": true,
      "usuario": { "nome": "João Silva" },
      "itens": [
        {
          "produtoId": "uuid-produto-a",
          "quantidadeInicial": 50,
          "quantidadeAtual": 40,
          "produto": { "nome": "Produto A" }
        }
        // ...outros itens
      ],
      "devolucoes": []
    }
    // ...outros carrinhos
  ]
}
```

---

### **GET** `/api/carrinho-usuarios/meu-carrinho`
**Permissão:** Funcionário autenticado

**Buscar carrinho ativo do dia atual do usuário logado**

**Response 200:**
```json
{
  "ok": true,
  "carrinho": {
    "id": "uuid",
    "quantidadeInicial": 100,
    "quantidadeAtual": 85,
    "data": "2026-03-11",
    "ativo": true,
    "itens": [
      {
        "produtoId": "uuid",
        "produto": { "nome": "Produto A" },
        "quantidadeInicial": 50,
        "quantidadeAtual": 40
      }
      // ...outros itens
    ]
  }
}
```

**Response 404** (sem carrinho):
```json
{
  "ok": false,
  "erro": "Nenhum carrinho ativo encontrado para hoje"
}
```

---

### **POST** `/api/carrinho-usuarios/devolucao`
**Permissão:** Funcionário autenticado

**Registrar devolução de produtos no final do dia**

**Request Body:**
```json
{
  "carrinhoId": "uuid-do-carrinho",
  "observacao": "Observação opcional",  // opcional
  "itens": [
    {
      "produtoId": "uuid-produto-a",
      "quantidadeDevolvida": 35
    },
    {
      "produtoId": "uuid-produto-b",
      "quantidadeDevolvida": 25
    },
    {
      "produtoId": "uuid-produto-c",
      "quantidadeDevolvida": 22
    }
  ]
}
```

**Response 200** (com discrepância):
```json
{
  "ok": true,
  "alertaGerado": true,
  "mensagem": "Devolução registrada. ATENÇÃO: Discrepância de -3 produtos (falta).",
  "devolucao": {
    "id": "uuid",
    "carrinhoId": "uuid",
    "quantidadeDevolvida": 82,
    "quantidadeEsperada": 85,
    "discrepancia": -3,
    "alertaAtivo": true,
    "observacao": "Observação opcional",
    "itens": [
      {
        "produtoId": "uuid-produto-a",
        "produto": { "nome": "Produto A" },
        "quantidadeDevolvida": 35,
        "quantidadeEsperada": 40,
        "discrepancia": -5  // FALTA
      },
      {
        "produtoId": "uuid-produto-b",
        "produto": { "nome": "Produto B" },
        "quantidadeDevolvida": 25,
        "quantidadeEsperada": 25,
        "discrepancia": 0  // OK
      },
      {
        "produtoId": "uuid-produto-c",
        "produto": { "nome": "Produto C" },
        "quantidadeDevolvida": 22,
        "quantidadeEsperada": 20,
        "discrepancia": 2  // SOBRA
      }
    ]
  }
}
```

**Response 200** (sem discrepância):
```json
{
  "ok": true,
  "alertaGerado": false,
  "mensagem": "Devolução registrada com sucesso! Quantidades conferem.",
  "devolucao": { /*...mesma estrutura...*/ }
}
```

---

### **POST** `/api/carrinho-usuarios/devolucao-admin`
**Permissão:** Admin ou emails autorizados

**Registrar devolução em nome de um funcionário**

**Request Body:**
```json
{
  "usuarioIdFuncionario": "uuid-do-funcionario",
  "observacao": "Funcionário saiu mais cedo",  // opcional
  "itens": [
    {
      "produtoId": "uuid-produto-a",
      "quantidadeDevolvida": 35
    },
    {
      "produtoId": "uuid-produto-b",
      "quantidadeDevolvida": 25
    }
    // ...outros produtos
  ]
}
```

**Response:** Mesma estrutura da devolução normal, mas a observação incluirá automaticamente:
```
"observacao": "(Registrado por eriky@clubekids.com) Funcionário saiu mais cedo"
```

---

### **GET** `/api/carrinho-usuarios/alertas`
**Permissão:** Admin ou emails autorizados

**Listar devoluções com discrepância**

**Query Params:**
- `usuarioId` (opcional): Filtrar por funcionário
- `apenasAtivos` (opcional): "true" para apenas alertas não resolvidos

**Response 200:**
```json
{
  "ok": true,
  "alertas": [
    {
      "id": "uuid",
      "discrepancia": -5,
      "alertaAtivo": true,
      "observacao": "...",
      "dataDevolucao": "2026-03-11T18:30:00Z",
      "carrinho": {
        "data": "2026-03-11",
        "usuario": { "nome": "João Silva" }
      },
      "itens": [
        {
          "produto": { "nome": "Produto A" },
          "quantidadeDevolvida": 35,
          "quantidadeEsperada": 40,
          "discrepancia": -5
        }
      ]
    }
  ]
}
```

---

### **PUT** `/api/carrinho-usuarios/alertas/:id/desativar`
**Permissão:** Admin ou emails autorizados

**Desativar alerta de discrepância (marcar como resolvido)**

**Response 200:**
```json
{
  "ok": true,
  "mensagem": "Alerta desativado com sucesso",
  "devolucao": { /*...*/ }
}
```

---

## 🎨 Integração Frontend

### Criação de Carrinho

**Formulário:**
```jsx
function CriarCarrinhoForm() {
  const [funcionarioId, setFuncionarioId] = useState('');
  const [itens, setItens] = useState([]);
  
  const addProduto = (produtoId, quantidade) => {
    setItens([...itens, { produtoId, quantidade }]);
  };

  const handleSubmit = async () => {
    await api.post('/api/carrinho-usuarios', {
      usuarioId: funcionarioId,
      itens: itens
    });
  };

  return (
    <form>
      <select onChange={(e) => setFuncionarioId(e.target.value)}>
        <option>Selecione funcionário</option>
        {/* ...funcionários */}
      </select>

      <h3>Produtos do Carrinho</h3>
      {produtos.map(produto => (
        <div key={produto.id}>
          <span>{produto.nome}</span>
          <input 
            type="number"
            min="0"
            placeholder="Quantidade"
            onChange={(e) => addProduto(produto.id, parseInt(e.target.value))}
          />
        </div>
      ))}

      <button onClick={handleSubmit}>Criar Carrinho</button>
    </form>
  );
}
```

### Visualização do Carrinho (Funcionário)

```jsx
function MeuCarrinho() {
  const [carrinho, setCarrinho] = useState(null);

  useEffect(() => {
    const fetchCarrinho = async () => {
      const res = await api.get('/api/carrinho-usuarios/meu-carrinho');
      setCarrinho(res.data.carrinho);
    };
    fetchCarrinho();
  }, []);

  if (!carrinho) return <p>Você não tem carrinho ativo hoje</p>;

  return (
    <div>
      <h2>Meu Carrinho - {new Date(carrinho.data).toLocaleDateString()}</h2>
      <p>Total Inicial: {carrinho.quantidadeInicial} | Restante: {carrinho.quantidadeAtual}</p>

      <h3>Produtos:</h3>
      <table>
        <thead>
          <tr>
            <th>Produto</th>
            <th>Inicial</th>
            <th>Restante</th>
            <th>Usado</th>
            <th>%</th>
          </tr>
        </thead>
        <tbody>
          {carrinho.itens.map(item => {
            const usado = item.quantidadeInicial - item.quantidadeAtual;
            const percentual = ((usado / item.quantidadeInicial) * 100).toFixed(0);
            
            return (
              <tr key={item.id}>
                <td>{item.produto.nome}</td>
                <td>{item.quantidadeInicial}</td>
                <td>{item.quantidadeAtual}</td>
                <td>{usado}</td>
                <td>
                  <div className="progress-bar">
                    <div style={{ width: `${percentual}%` }}></div>
                  </div>
                  {percentual}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

### Formulário de Devolução

```jsx
function DevolverCarrinhoForm({ carrinho }) {
  const [itens, setItens] = useState(
    carrinho.itens.map(item => ({
      produtoId: item.produtoId,
      quantidadeDevolvida: item.quantidadeAtual // Pré-preenche com quantidade esperada
    }))
  );
  const [observacao, setObservacao] = useState('');

  const handleChange = (produtoId, quantidade) => {
    setItens(itens.map(item => 
      item.produtoId === produtoId 
        ? { ...item, quantidadeDevolvida: parseInt(quantidade) }
        : item
    ));
  };

  const handleSubmit = async () => {
    const res = await api.post('/api/carrinho-usuarios/devolucao', {
      carrinhoId: carrinho.id,
      itens,
      observacao
    });

    if (res.data.alertaGerado) {
      alert('⚠️ ' + res.data.mensagem);
    } else {
      alert('✅ ' + res.data.mensagem);
    }
  };

  return (
    <form>
      <h2>Devolver Carrinho</h2>
      <p>⚠️ Informe quanto sobrou de cada produto:</p>

      <table>
        <thead>
          <tr>
            <th>Produto</th>
            <th>Esperado</th>
            <th>Devolvido</th>
          </tr>
        </thead>
        <tbody>
          {carrinho.itens.map(item => {
            const itemDevolucao = itens.find(i => i.produtoId === item.produtoId);
            const discrepancia = itemDevolucao?.quantidadeDevolvida - item.quantidadeAtual;
            
            return (
              <tr key={item.id}>
                <td>{item.produto.nome}</td>
                <td className="esperado">{item.quantidadeAtual}</td>
                <td>
                  <input
                    type="number"
                    value={itemDevolucao?.quantidadeDevolvida || 0}
                    onChange={(e) => handleChange(item.produtoId, e.target.value)}
                    min="0"
                    style={{
                      borderColor: discrepancia !== 0 ? 'orange' : 'green'
                    }}
                  />
                  {discrepancia !== 0 && (
                    <span className={discrepancia > 0 ? 'sobra' : 'falta'}>
                      {discrepancia > 0 ? `+${discrepancia} sobra` : `${discrepancia} falta`}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <label>
        Observação (opcional):
        <textarea
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          placeholder="Ex: Houve problemas na máquina X"
        />
      </label>

      <button onClick={handleSubmit}>Confirmar Devolução</button>
    </form>
  );
}
```

---

## 🔄 Desconto Automático nas Movimentações

Quando o funcionário faz uma movimentação e abastece uma máquina:

1. **Frontend envia produtos abastecidos:**
```json
{
  "maquinaId": "uuid",
  "totalPre": 50,
  "abastecidas": 25,
  "produtos": [
    {
      "produtoId": "uuid-produto-a",
      "quantidadeSaiu": 5,
      "quantidadeAbastecida": 10
    },
    {
      "produtoId": "uuid-produto-b",
      "quantidadeSaiu": 3,
      "quantidadeAbastecida": 5
    }
  ]
}
```

2. **Backend desconta automaticamente:**
   - ✅ Desconta do **estoque da loja**
   - ✅ Desconta do **carrinho do usuário** (por produto)
   - ✅ Atualiza **quantidade total** do carrinho

3. **Nenhuma ação adicional necessária do usuário!**

---

## ⚠️ Quebra de Compatibilidade (Breaking Changes)

### ❌ REMOVIDO: Quantidade total única
```json
// ANTES (não funciona mais):
{
  "usuarioId": "uuid",
  "quantidadeInicial": 100
}
```

### ✅ NOVO: Array de itens com produtos
```json
// AGORA (obrigatório):
{
  "usuarioId": "uuid",
  "itens": [
    { "produtoId": "uuid-a", "quantidade": 50 },
    { "produtoId": "uuid-b", "quantidade": 30 },
    { "produtoId": "uuid-c", "quantidade": 20 }
  ]
}
```

### Devolução também mudou:
```json
// ANTES:
{
  "carrinhoId": "uuid",
  "quantidadeDevolvida": 85
}

// AGORA:
{
  "carrinhoId": "uuid",
  "itens": [
    { "produtoId": "uuid-a", "quantidadeDevolvida": 40 },
    { "produtoId": "uuid-b", "quantidadeDevolvida": 25 },
    { "produtoId": "uuid-c", "quantidadeDevolvida": 20 }
  ]
}
```

---

## 📊 Exemplos de Resposta Completa

### Carrinho Completo com Devolução
```json
{
  "id": "carrinho-uuid",
  "usuarioId": "usuario-uuid",
  "quantidadeInicial": 100,
  "quantidadeAtual": 0,
  "data": "2026-03-11",
  "ativo": false,
  "usuario": {
    "id": "usuario-uuid",
    "nome": "João Silva",
    "email": "joao@example.com"
  },
  "itens": [
    {
      "id": "item-1-uuid",
      "carrinhoId": "carrinho-uuid",
      "produtoId": "produto-a-uuid",
      "quantidadeInicial": 50,
      "quantidadeAtual": 0,
      "produto": {
        "id": "produto-a-uuid",
        "nome": "Produto A",
        "preco": 10.00
      }
    },
    {
      "id": "item-2-uuid",
      "carrinhoId": "carrinho-uuid",
      "produtoId": "produto-b-uuid",
      "quantidadeInicial": 30,
      "quantidadeAtual": 0,
      "produto": {
        "id": "produto-b-uuid",
        "nome": "Produto B",
        "preco": 15.00
      }
    },
    {
      "id": "item-3-uuid",
      "carrinhoId": "carrinho-uuid",
      "produtoId": "produto-c-uuid",
      "quantidadeInicial": 20,
      "quantidadeAtual": 0,
      "produto": {
        "id": "produto-c-uuid",
        "nome": "Produto C",
        "preco": 20.00
      }
    }
  ],
  "devolucoes": [
    {
      "id": "devolucao-uuid",
      "carrinhoId": "carrinho-uuid",
      "usuarioId": "usuario-uuid",
      "quantidadeDevolvida": 97,
      "quantidadeEsperada": 100,
      "discrepancia": -3,
      "alertaAtivo": true,
      "observacao": "Final do dia",
      "dataDevolucao": "2026-03-11T18:30:00Z",
      "itens": [
        {
          "id": "dev-item-1-uuid",
          "devolucaoId": "devolucao-uuid",
          "produtoId": "produto-a-uuid",
          "quantidadeDevolvida": 45,
          "quantidadeEsperada": 50,
          "discrepancia": -5,
          "produto": {
            "id": "produto-a-uuid",
            "nome": "Produto A"
          }
        },
        {
          "id": "dev-item-2-uuid",
          "devolucaoId": "devolucao-uuid",
          "produtoId": "produto-b-uuid",
          "quantidadeDevolvida": 30,
          "quantidadeEsperada": 30,
          "discrepancia": 0,
          "produto": {
            "id": "produto-b-uuid",
            "nome": "Produto B"
          }
        },
        {
          "id": "dev-item-3-uuid",
          "devolucaoId": "devolucao-uuid",
          "produtoId": "produto-c-uuid",
          "quantidadeDevolvida": 22,
          "quantidadeEsperada": 20,
          "discrepancia": 2,
          "produto": {
            "id": "produto-c-uuid",
            "nome": "Produto C"
          }
        }
      ]
    }
  ]
}
```

---

## 🚀 Próximos Passos

1. ✅ Criar migration para adicionar novas tabelas no banco de dados
2. ✅ Atualizar frontend para usar novo formato de API
3. ✅ Testar fluxo completo: criação → movimentação → devolução
4. ✅ Implementar relatórios por produto individual
5. ✅ Adicionar validações de quantidade negativa

---

## ❓ FAQ

**P: Preciso informar TODOS os produtos na devolução?**
R: Sim! Você deve informar a quantidade devolvida de cada produto que estava no carrinho.

**P: O que acontece se eu abastecer um produto que não está no meu carrinho?**
R: O sistema não desconta (pois não há item), mas registra a movimentação normalmente. Será gerado um log de aviso.

**P: Posso editar um carrinho depois de criado?**
R: Sim, use o endpoint `PUT /api/carrinho-usuarios/:id` (funcionalidade existente).

**P: O desconto é automático mesmo se eu não informar o produto na movimentação?**
R: Só desconta se você informar o campo `produtos` na movimentação. Se não informar, funciona como antes (apenas quantidade total).

---

✅ **Documentação completa! Sistema pronto para uso com controle individual de produtos.**
