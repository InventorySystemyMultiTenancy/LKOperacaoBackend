# 🎨 Frontend: Alterações Necessárias - Carrinhos por Produto

## 📋 Resumo das Mudanças

O sistema de carrinhos foi **completamente reformulado**:

- **ANTES**: Quantidade total única no carrinho
- **AGORA**: Array de produtos com quantidades individuais

## ⚠️ BREAKING CHANGES - API Mudou!

### 🔴 Endpoints que MUDARAM:

| Endpoint | O que mudou |
|----------|-------------|
| `POST /api/carrinho-usuarios` | Agora recebe array `itens[]` ao invés de `quantidadeInicial` |
| `GET /api/carrinho-usuarios` | Resposta inclui array `itens[]` com produtos |
| `GET /api/carrinho-usuarios/atual` | Resposta inclui array `itens[]` com produtos |
| `POST /api/carrinho-usuarios/devolucao` | Agora recebe array `itens[]` ao invés de `quantidadeDevolvida` |
| `POST /api/carrinho-usuarios/devolucao-admin` | Agora recebe array `itens[]` ao invés de `quantidadeDevolvida` |

---

## 🛠️ Alterações por Tela/Componente

### 1️⃣ **CRIAR CARRINHO** (Admin)

#### ❌ Código ANTIGO (não funciona mais):
```javascript
// ❌ NÃO USE MAIS ISSO
const criarCarrinho = async () => {
  const response = await fetch('/api/carrinho-usuarios', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      usuarioId: usuarioSelecionado,
      quantidadeInicial: 100  // ❌ ANTIGO
    })
  });
};
```

#### ✅ Código NOVO (use isso):
```javascript
// ✅ NOVA ESTRUTURA
const criarCarrinho = async () => {
  const response = await fetch('/api/carrinho-usuarios', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      usuarioId: usuarioSelecionado,
      itens: [  // ✅ NOVO: Array de produtos
        { produtoId: "uuid-produto-1", quantidade: 50 },
        { produtoId: "uuid-produto-2", quantidade: 30 },
        { produtoId: "uuid-produto-3", quantidade: 20 }
      ]
    })
  });
  
  const data = await response.json();
  console.log(data);
  // Retorna: { carrinho: {...}, itens: [...] }
};
```

#### 🎨 Componente React - Criar Carrinho:
```jsx
import React, { useState, useEffect } from 'react';

function CriarCarrinhoForm() {
  const [usuarios, setUsuarios] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [usuarioId, setUsuarioId] = useState('');
  const [itens, setItens] = useState([
    { produtoId: '', quantidade: 0 }
  ]);

  // Carregar produtos do backend
  useEffect(() => {
    fetch('/api/produtos')
      .then(res => res.json())
      .then(data => setProdutos(data));
  }, []);

  // Adicionar linha de produto
  const adicionarProduto = () => {
    setItens([...itens, { produtoId: '', quantidade: 0 }]);
  };

  // Remover linha de produto
  const removerProduto = (index) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  // Atualizar produto específico
  const atualizarItem = (index, campo, valor) => {
    const novosItens = [...itens];
    novosItens[index][campo] = valor;
    setItens(novosItens);
  };

  // Enviar para backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar
    const itensValidos = itens.filter(
      item => item.produtoId && item.quantidade > 0
    );
    
    if (itensValidos.length === 0) {
      alert('Adicione pelo menos um produto com quantidade!');
      return;
    }

    try {
      const response = await fetch('/api/carrinho-usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          usuarioId,
          itens: itensValidos
        })
      });

      if (response.ok) {
        alert('Carrinho criado com sucesso!');
        // Limpar form ou redirecionar
      } else {
        const error = await response.json();
        alert('Erro: ' + error.message);
      }
    } catch (error) {
      alert('Erro ao criar carrinho: ' + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Criar Carrinho Diário</h2>
      
      {/* Selecionar Funcionário */}
      <div>
        <label>Funcionário:</label>
        <select 
          value={usuarioId} 
          onChange={(e) => setUsuarioId(e.target.value)}
          required
        >
          <option value="">Selecione...</option>
          {usuarios.map(u => (
            <option key={u.id} value={u.id}>{u.nome}</option>
          ))}
        </select>
      </div>

      {/* Lista de Produtos */}
      <div>
        <h3>Produtos no Carrinho</h3>
        {itens.map((item, index) => (
          <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <select
              value={item.produtoId}
              onChange={(e) => atualizarItem(index, 'produtoId', e.target.value)}
              required
            >
              <option value="">Selecione produto...</option>
              {produtos.map(p => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>

            <input
              type="number"
              min="1"
              placeholder="Quantidade"
              value={item.quantidade}
              onChange={(e) => atualizarItem(index, 'quantidade', parseInt(e.target.value))}
              required
            />

            <button 
              type="button" 
              onClick={() => removerProduto(index)}
              disabled={itens.length === 1}
            >
              ❌ Remover
            </button>
          </div>
        ))}

        <button type="button" onClick={adicionarProduto}>
          ➕ Adicionar Produto
        </button>
      </div>

      {/* Total */}
      <div>
        <strong>
          Total de produtos: {itens.reduce((sum, item) => sum + (item.quantidade || 0), 0)}
        </strong>
      </div>

      <button type="submit">Criar Carrinho</button>
    </form>
  );
}

export default CriarCarrinhoForm;
```

---

### 2️⃣ **LISTAR/VISUALIZAR CARRINHO**

#### ❌ Resposta ANTIGA:
```json
{
  "id": "uuid",
  "usuarioId": "uuid",
  "quantidadeInicial": 100,
  "quantidadeAtual": 75,
  "data": "2026-03-11"
}
```

#### ✅ Resposta NOVA:
```json
{
  "id": "uuid",
  "usuarioId": "uuid",
  "quantidadeInicial": 100,
  "quantidadeAtual": 75,
  "data": "2026-03-11",
  "itens": [
    {
      "id": "uuid-item-1",
      "produtoId": "uuid-produto-1",
      "quantidadeInicial": 50,
      "quantidadeAtual": 35,
      "produto": {
        "id": "uuid-produto-1",
        "nome": "Coca-Cola Lata",
        "codigo": "CC-350"
      }
    },
    {
      "id": "uuid-item-2",
      "produtoId": "uuid-produto-2",
      "quantidadeInicial": 30,
      "quantidadeAtual": 25,
      "produto": {
        "id": "uuid-produto-2",
        "nome": "Guaraná Lata",
        "codigo": "GU-350"
      }
    }
  ]
}
```

#### 🎨 Componente React - Ver Carrinho:
```jsx
function CarrinhoDetalhes() {
  const [carrinho, setCarrinho] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/carrinho-usuarios/atual', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setCarrinho(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Carregando...</p>;
  if (!carrinho) return <p>Nenhum carrinho ativo hoje</p>;

  return (
    <div>
      <h2>Meu Carrinho - {new Date(carrinho.data).toLocaleDateString()}</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <p><strong>Total Inicial:</strong> {carrinho.quantidadeInicial} produtos</p>
        <p><strong>Total Restante:</strong> {carrinho.quantidadeAtual} produtos</p>
        <p><strong>Já usado:</strong> {carrinho.quantidadeInicial - carrinho.quantidadeAtual} produtos</p>
      </div>

      <h3>Produtos no Carrinho</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #333' }}>
            <th>Código</th>
            <th>Produto</th>
            <th>Qtd Inicial</th>
            <th>Qtd Restante</th>
            <th>Já Usado</th>
            <th>% Usado</th>
          </tr>
        </thead>
        <tbody>
          {carrinho.itens?.map(item => {
            const usado = item.quantidadeInicial - item.quantidadeAtual;
            const percentual = ((usado / item.quantidadeInicial) * 100).toFixed(0);
            
            return (
              <tr key={item.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td>{item.produto.codigo}</td>
                <td>{item.produto.nome}</td>
                <td>{item.quantidadeInicial}</td>
                <td style={{ 
                  fontWeight: 'bold',
                  color: item.quantidadeAtual === 0 ? 'red' : 'inherit'
                }}>
                  {item.quantidadeAtual}
                </td>
                <td>{usado}</td>
                <td>
                  <div style={{ 
                    width: '50px', 
                    height: '20px', 
                    background: '#eee',
                    position: 'relative'
                  }}>
                    <div style={{
                      width: `${percentual}%`,
                      height: '100%',
                      background: percentual > 80 ? '#ff4444' : '#4CAF50'
                    }} />
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

export default CarrinhoDetalhes;
```

---

### 3️⃣ **DEVOLVER CARRINHO** (Funcionário)

#### ❌ Código ANTIGO:
```javascript
// ❌ NÃO USE MAIS
const devolverCarrinho = async () => {
  await fetch('/api/carrinho-usuarios/devolucao', {
    method: 'POST',
    body: JSON.stringify({
      carrinhoId: carrinho.id,
      quantidadeDevolvida: 75  // ❌ ANTIGO: quantidade única
    })
  });
};
```

#### ✅ Código NOVO:
```javascript
// ✅ NOVO: devolução por produto
const devolverCarrinho = async () => {
  await fetch('/api/carrinho-usuarios/devolucao', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      carrinhoId: carrinho.id,
      itens: [  // ✅ Array de produtos devolvidos
        { produtoId: "uuid-produto-1", quantidadeDevolvida: 35 },
        { produtoId: "uuid-produto-2", quantidadeDevolvida: 25 },
        { produtoId: "uuid-produto-3", quantidadeDevolvida: 15 }
      ]
    })
  });
};
```

#### 🎨 Componente React - Devolver Carrinho:
```jsx
function DevolverCarrinhoForm() {
  const [carrinho, setCarrinho] = useState(null);
  const [itens, setItens] = useState([]);

  useEffect(() => {
    // Buscar carrinho atual
    fetch('/api/carrinho-usuarios/atual', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        setCarrinho(data);
        // Pré-preencher com quantidadeAtual (esperada)
        setItens(data.itens.map(item => ({
          produtoId: item.produtoId,
          produto: item.produto,
          quantidadeEsperada: item.quantidadeAtual,
          quantidadeDevolvida: item.quantidadeAtual  // Sugestão
        })));
      });
  }, []);

  const atualizarQuantidade = (index, valor) => {
    const novosItens = [...itens];
    novosItens[index].quantidadeDevolvida = parseInt(valor) || 0;
    setItens(novosItens);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/carrinho-usuarios/devolucao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          carrinhoId: carrinho.id,
          itens: itens.map(item => ({
            produtoId: item.produtoId,
            quantidadeDevolvida: item.quantidadeDevolvida
          }))
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Verificar se há discrepâncias
        const comDiscrepancia = data.itens.filter(item => item.discrepancia !== 0);
        
        if (comDiscrepancia.length > 0) {
          alert(`⚠️ ATENÇÃO: Há discrepâncias em ${comDiscrepancia.length} produto(s)!`);
        } else {
          alert('✅ Devolução registrada sem discrepâncias!');
        }
        
        // Redirecionar ou limpar
      } else {
        alert('Erro: ' + data.message);
      }
    } catch (error) {
      alert('Erro: ' + error.message);
    }
  };

  if (!carrinho) return <p>Carregando...</p>;

  return (
    <form onSubmit={handleSubmit}>
      <h2>Devolver Produtos do Carrinho</h2>
      <p>Informe a quantidade de cada produto que você está devolvendo:</p>

      <table style={{ width: '100%', marginTop: '20px' }}>
        <thead>
          <tr>
            <th>Produto</th>
            <th>Esperado</th>
            <th>Devolvendo</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {itens.map((item, index) => {
            const diferenca = item.quantidadeDevolvida - item.quantidadeEsperada;
            
            return (
              <tr key={item.produtoId}>
                <td>
                  <strong>{item.produto.nome}</strong><br/>
                  <small>{item.produto.codigo}</small>
                </td>
                <td>
                  {item.quantidadeEsperada}
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    value={item.quantidadeDevolvida}
                    onChange={(e) => atualizarQuantidade(index, e.target.value)}
                    style={{
                      width: '80px',
                      padding: '5px',
                      fontSize: '16px'
                    }}
                  />
                </td>
                <td>
                  {diferenca === 0 && <span style={{ color: 'green' }}>✅ OK</span>}
                  {diferenca > 0 && <span style={{ color: 'orange' }}>⚠️ Sobra: +{diferenca}</span>}
                  {diferenca < 0 && <span style={{ color: 'red' }}>❌ Falta: {diferenca}</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{ marginTop: '20px' }}>
        <button type="submit" style={{ padding: '10px 20px', fontSize: '16px' }}>
          Registrar Devolução
        </button>
      </div>
    </form>
  );
}

export default DevolverCarrinhoForm;
```

---

### 4️⃣ **DEVOLUÇÃO POR ADMIN** (Admin devolvendo por funcionário)

#### ✅ Endpoint:
```javascript
POST /api/carrinho-usuarios/devolucao-admin
{
  "carrinhoId": "uuid",
  "itens": [
    { "produtoId": "uuid-1", "quantidadeDevolvida": 35 },
    { "produtoId": "uuid-2", "quantidadeDevolvida": 25 }
  ]
}
```

Componente similar ao anterior, mas acessa endpoint `/devolucao-admin`.

---

### 5️⃣ **HISTÓRICO DE DEVOLUÇÕES**

#### ✅ Endpoint:
```javascript
GET /api/carrinho-usuarios/devolucoes
```

#### ✅ Resposta:
```json
[
  {
    "id": "uuid-devolucao",
    "carrinhoId": "uuid",
    "data": "2026-03-11T18:30:00Z",
    "totalDiscrepancia": -5,
    "alertaAtivo": true,
    "itens": [
      {
        "produtoId": "uuid-produto-1",
        "quantidadeDevolvida": 35,
        "quantidadeEsperada": 35,
        "discrepancia": 0,
        "produto": { "nome": "Coca-Cola" }
      },
      {
        "produtoId": "uuid-produto-2",
        "quantidadeDevolvida": 20,
        "quantidadeEsperada": 25,
        "discrepancia": -5,
        "produto": { "nome": "Guaraná" }
      }
    ]
  }
]
```

---

## 🔄 O que NÃO precisa mudar

### ✅ Movimentações continuam iguais:
O endpoint de movimentação **NÃO mudou**:

```javascript
// Continua funcionando normalmente
POST /api/movimentacao
{
  "maquinaId": "uuid",
  "produtos": [
    { "produtoId": "uuid", "quantidadeAbastecida": 10 }
  ]
}
```

**O que mudou**: O backend agora desconta automaticamente do carrinho por produto. Frontend não precisa fazer nada!

---

## 📊 Checklist de Implementação

### Frontend:

- [ ] **Criar Carrinho**: Alterar form para aceitar múltiplos produtos (array)
- [ ] **Visualizar Carrinho**: Mostrar tabela de produtos ao invés de quantidade única
- [ ] **Devolver Carrinho**: Form com input para cada produto individualmente
- [ ] **Histórico**: Mostrar discrepâncias por produto (se houver tela)
- [ ] **Validações**: Garantir que cada produto tem quantidade > 0
- [ ] **Feedback**: Alertas específicos quando há discrepância por produto

---

## 🧪 Como Testar

1. **Criar carrinho com 3 produtos diferentes**
2. **Fazer movimentação** → Verificar se desconta automaticamente
3. **Visualizar carrinho** → Ver quantidadeAtual de cada produto atualizada
4. **Devolver carrinho** → Informar quantidades diferentes para testar discrepâncias
5. **Verificar alertas** → Admin deve ver quais produtos têm discrepância

---

## 💡 Dicas

### Reutilizar lógica:
```javascript
// Calcular total de um carrinho
const calcularTotal = (itens) => {
  return itens.reduce((sum, item) => sum + item.quantidadeAtual, 0);
};

// Verificar se tem discrepância
const temDiscrepancia = (devolucao) => {
  return devolucao.itens.some(item => item.discrepancia !== 0);
};
```

### Validação antes de enviar:
```javascript
const validarItens = (itens) => {
  // Remover produtos sem quantidade
  const validos = itens.filter(item => item.produtoId && item.quantidade > 0);
  
  // Verificar duplicados
  const produtosUnicos = new Set(validos.map(i => i.produtoId));
  if (produtosUnicos.size !== validos.length) {
    throw new Error('Produto duplicado no carrinho!');
  }
  
  return validos;
};
```

---

## 📞 Contato

Se tiver dúvidas sobre:
- **Estrutura dos dados**: Veja [SISTEMA_CARRINHOS_POR_PRODUTO.md](./SISTEMA_CARRINHOS_POR_PRODUTO.md)
- **Responses da API**: Teste os endpoints com Postman/Insomnia
- **Erros**: Verifique o console do backend (logs detalhados)

**✨ Boa implementação!**
