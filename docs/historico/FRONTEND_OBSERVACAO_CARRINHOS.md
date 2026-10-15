# 🎨 Frontend: Campo OBSERVAÇÃO em Carrinhos

**Data:** 12 de março de 2026  
**Funcionalidade:** Campo opcional de observação ao criar carrinho e devolver produtos

---

## 📋 Resumo das Mudanças

Adicionado campo **`observacao`** (opcional) em duas operações:

1. **Criar Carrinho** - Admin pode adicionar observação ao criar carrinho para funcionário
2. **Devolver Carrinho** - Funcionário/Admin pode adicionar observação ao devolver produtos

---

## 🗄️ Mudanças no Banco de Dados

### Colunas adicionadas:

**Tabela:** `carrinho_usuarios`
- **Coluna:** `observacao` (TEXT, pode ser NULL)
- **Uso:** Observações sobre o carrinho no momento da criação

**Tabela:** `devolucoes_carrinho`
- **Coluna:** `observacao` (TEXT, pode ser NULL)
- **Uso:** Observações sobre a devolução

### ✅ Executar Migration:

```sql
-- Já está no arquivo: MIGRATION_OBSERVACAO_CARRINHOS.sql
-- Execute no DBeaver (selecione tudo e Ctrl+Enter)

ALTER TABLE carrinho_usuarios 
ADD COLUMN IF NOT EXISTS observacao TEXT;

ALTER TABLE devolucoes_carrinho 
ADD COLUMN IF NOT EXISTS observacao TEXT;
```

---

## 🛠️ Alterações na API (Backend)

### ✅ Backend já está pronto!

Todos os endpoints já aceitam e retornam o campo `observacao`.

---

## 🎨 Alterações no Frontend

### 1️⃣ **CRIAR CARRINHO** (Admin)

#### Request:

**Endpoint:** `POST /api/carrinho-usuarios`

**Antes:**
```json
{
  "usuarioId": "uuid-funcionario",
  "itens": [
    { "produtoId": "uuid-produto-1", "quantidade": 50 },
    { "produtoId": "uuid-produto-2", "quantidade": 30 }
  ]
}
```

**Agora (com observação OPCIONAL):**
```json
{
  "usuarioId": "uuid-funcionario",
  "itens": [
    { "produtoId": "uuid-produto-1", "quantidade": 50 },
    { "produtoId": "uuid-produto-2", "quantidade": 30 }
  ],
  "observacao": "Cliente VIP - priorizar produtos premium"
}
```

#### Response:

```json
{
  "ok": true,
  "carrinho": {
    "id": "uuid-carrinho",
    "usuarioId": "uuid-funcionario",
    "quantidadeInicial": 80,
    "quantidadeAtual": 80,
    "data": "2026-03-12",
    "ativo": true,
    "observacao": "Cliente VIP - priorizar produtos premium",
    "createdAt": "2026-03-12T10:30:00Z"
  },
  "itens": [...]
}
```

#### 🎨 Componente React - Criar Carrinho:

```jsx
import React, { useState, useEffect } from 'react';

function CriarCarrinhoForm() {
  const [usuarios, setUsuarios] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [usuarioId, setUsuarioId] = useState('');
  const [observacao, setObservacao] = useState(''); // ✅ NOVO
  const [itens, setItens] = useState([
    { produtoId: '', quantidade: 0 }
  ]);

  // ... código de carregar usuários e produtos ...

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const itensValidos = itens.filter(
      item => item.produtoId && item.quantidade > 0
    );
    
    if (itensValidos.length === 0) {
      alert('Adicione pelo menos um produto!');
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
          itens: itensValidos,
          observacao: observacao.trim() || undefined // ✅ NOVO: Enviar apenas se preenchido
        })
      });

      if (response.ok) {
        alert('Carrinho criado com sucesso!');
        // Limpar form
        setObservacao('');
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
              onChange={(e) => {
                const novosItens = [...itens];
                novosItens[index].produtoId = e.target.value;
                setItens(novosItens);
              }}
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
              onChange={(e) => {
                const novosItens = [...itens];
                novosItens[index].quantidade = parseInt(e.target.value) || 0;
                setItens(novosItens);
              }}
              required
            />

            <button 
              type="button" 
              onClick={() => setItens(itens.filter((_, i) => i !== index))}
              disabled={itens.length === 1}
            >
              ❌
            </button>
          </div>
        ))}

        <button 
          type="button" 
          onClick={() => setItens([...itens, { produtoId: '', quantidade: 0 }])}
        >
          ➕ Adicionar Produto
        </button>
      </div>

      {/* ✅ NOVO: Campo Observação */}
      <div style={{ marginTop: '20px' }}>
        <label>
          <strong>Observação (opcional):</strong>
        </label>
        <textarea
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          placeholder="Ex: Cliente VIP, Evento especial, Pedido urgente..."
          rows={3}
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '14px',
            resize: 'vertical'
          }}
          maxLength={500}
        />
        <small style={{ color: '#666' }}>
          {observacao.length}/500 caracteres
        </small>
      </div>

      {/* Total */}
      <div style={{ marginTop: '15px' }}>
        <strong>
          Total de produtos: {itens.reduce((sum, item) => sum + (item.quantidade || 0), 0)}
        </strong>
      </div>

      <button type="submit" style={{ marginTop: '20px' }}>
        Criar Carrinho
      </button>
    </form>
  );
}

export default CriarCarrinhoForm;
```

---

### 2️⃣ **VISUALIZAR CARRINHO** (com observação)

#### Response de GET `/api/carrinho-usuarios/atual`:

```json
{
  "id": "uuid",
  "usuarioId": "uuid",
  "quantidadeInicial": 100,
  "quantidadeAtual": 75,
  "data": "2026-03-12",
  "ativo": true,
  "observacao": "Cliente VIP - priorizar produtos premium",
  "itens": [...]
}
```

#### 🎨 Componente React - Ver Carrinho:

```jsx
function CarrinhoDetalhes() {
  const [carrinho, setCarrinho] = useState(null);

  useEffect(() => {
    fetch('/api/carrinho-usuarios/atual', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => setCarrinho(data));
  }, []);

  if (!carrinho) return <p>Carregando...</p>;

  return (
    <div>
      <h2>Meu Carrinho - {new Date(carrinho.data).toLocaleDateString()}</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <p><strong>Total Inicial:</strong> {carrinho.quantidadeInicial}</p>
        <p><strong>Total Restante:</strong> {carrinho.quantidadeAtual}</p>
        
        {/* ✅ NOVO: Mostrar observação se existir */}
        {carrinho.observacao && (
          <div style={{
            marginTop: '10px',
            padding: '10px',
            background: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '4px'
          }}>
            <strong>📝 Observação:</strong>
            <p style={{ margin: '5px 0 0 0' }}>{carrinho.observacao}</p>
          </div>
        )}
      </div>

      <h3>Produtos no Carrinho</h3>
      <table>
        {/* ... tabela de produtos ... */}
      </table>
    </div>
  );
}
```

---

### 3️⃣ **DEVOLVER CARRINHO** (Funcionário)

#### Request:

**Endpoint:** `POST /api/carrinho-usuarios/devolucao`

**Antes:**
```json
{
  "carrinhoId": "uuid-carrinho",
  "itens": [
    { "produtoId": "uuid-produto-1", "quantidadeDevolvida": 35 },
    { "produtoId": "uuid-produto-2", "quantidadeDevolvida": 25 }
  ]
}
```

**Agora (com observação OPCIONAL):**
```json
{
  "carrinhoId": "uuid-carrinho",
  "itens": [
    { "produtoId": "uuid-produto-1", "quantidadeDevolvida": 35 },
    { "produtoId": "uuid-produto-2", "quantidadeDevolvida": 25 }
  ],
  "observacao": "Máquina 5 estava com defeito, não consegui abastecer todas"
}
```

#### Response:

```json
{
  "ok": true,
  "devolucao": {
    "id": "uuid-devolucao",
    "carrinhoId": "uuid-carrinho",
    "usuarioId": "uuid-funcionario",
    "quantidadeDevolvida": 60,
    "quantidadeEsperada": 65,
    "discrepancia": -5,
    "alertaAtivo": true,
    "observacao": "Máquina 5 estava com defeito, não consegui abastecer todas",
    "dataDevolucao": "2026-03-12T18:30:00Z"
  },
  "itens": [...]
}
```

#### 🎨 Componente React - Devolver Carrinho:

```jsx
function DevolverCarrinhoForm() {
  const [carrinho, setCarrinho] = useState(null);
  const [itens, setItens] = useState([]);
  const [observacao, setObservacao] = useState(''); // ✅ NOVO

  useEffect(() => {
    fetch('/api/carrinho-usuarios/atual', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        setCarrinho(data);
        setItens(data.itens.map(item => ({
          produtoId: item.produtoId,
          produto: item.produto,
          quantidadeEsperada: item.quantidadeAtual,
          quantidadeDevolvida: item.quantidadeAtual
        })));
      });
  }, []);

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
          })),
          observacao: observacao.trim() || undefined // ✅ NOVO
        })
      });

      const data = await response.json();

      if (response.ok) {
        const comDiscrepancia = data.itens?.filter(item => item.discrepancia !== 0);
        
        if (comDiscrepancia && comDiscrepancia.length > 0) {
          alert(`⚠️ ATENÇÃO: Há discrepâncias em ${comDiscrepancia.length} produto(s)!`);
        } else {
          alert('✅ Devolução registrada sem discrepâncias!');
        }
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
      
      {/* Mostrar observação do carrinho se existir */}
      {carrinho.observacao && (
        <div style={{
          padding: '10px',
          background: '#e3f2fd',
          border: '1px solid #2196f3',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <strong>📝 Observação do carrinho:</strong>
          <p style={{ margin: '5px 0 0 0' }}>{carrinho.observacao}</p>
        </div>
      )}

      <p>Informe a quantidade de cada produto que você está devolvendo:</p>

      {/* Tabela de produtos */}
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
                <td><strong>{item.produto.nome}</strong></td>
                <td>{item.quantidadeEsperada}</td>
                <td>
                  <input
                    type="number"
                    min="0"
                    value={item.quantidadeDevolvida}
                    onChange={(e) => {
                      const novosItens = [...itens];
                      novosItens[index].quantidadeDevolvida = parseInt(e.target.value) || 0;
                      setItens(novosItens);
                    }}
                    style={{ width: '80px', padding: '5px' }}
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

      {/* ✅ NOVO: Campo Observação */}
      <div style={{ marginTop: '20px' }}>
        <label>
          <strong>Observação sobre a devolução (opcional):</strong>
        </label>
        <textarea
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          placeholder="Ex: Máquina X com defeito, Loja Y fechada, Cliente cancelou pedido..."
          rows={3}
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '14px',
            resize: 'vertical',
            marginTop: '5px'
          }}
          maxLength={500}
        />
        <small style={{ color: '#666' }}>
          {observacao.length}/500 caracteres
        </small>
        <p style={{ fontSize: '12px', color: '#999', margin: '5px 0 0 0' }}>
          💡 Use este campo para explicar discrepâncias ou situações especiais
        </p>
      </div>

      <button 
        type="submit" 
        style={{ 
          marginTop: '20px',
          padding: '10px 20px',
          fontSize: '16px'
        }}
      >
        Registrar Devolução
      </button>
    </form>
  );
}

export default DevolverCarrinhoForm;
```

---

### 4️⃣ **DEVOLUÇÃO POR ADMIN**

#### Request:

**Endpoint:** `POST /api/carrinho-usuarios/devolucao-admin`

```json
{
  "usuarioIdFuncionario": "uuid-funcionario",
  "itens": [
    { "produtoId": "uuid-1", "quantidadeDevolvida": 35 }
  ],
  "observacao": "Funcionário pediu para registrar - estava sem celular"
}
```

**⚠️ Nota:** A observação do admin será prefixada automaticamente com o email de quem registrou:
```
"(Registrado por admin@empresa.com) Funcionário pediu para registrar - estava sem celular"
```

---

### 5️⃣ **HISTÓRICO DE DEVOLUÇÕES**

#### Response de GET `/api/carrinho-usuarios/devolucoes`:

```json
[
  {
    "id": "uuid-devolucao",
    "carrinhoId": "uuid",
    "totalDiscrepancia": -5,
    "alertaAtivo": true,
    "observacao": "Máquina 5 estava com defeito",
    "dataDevolucao": "2026-03-12T18:30:00Z",
    "itens": [...]
  }
]
```

#### 🎨 Componente React - Histórico:

```jsx
function HistoricoDevolucoesAdmin() {
  const [devolucoes, setDevolucoes] = useState([]);

  useEffect(() => {
    fetch('/api/carrinho-usuarios/devolucoes', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => setDevolucoes(data));
  }, []);

  return (
    <div>
      <h2>Histórico de Devoluções</h2>
      
      {devolucoes.map(dev => (
        <div 
          key={dev.id}
          style={{
            border: '1px solid #ddd',
            padding: '15px',
            marginBottom: '15px',
            borderRadius: '8px',
            background: dev.alertaAtivo ? '#fff3cd' : '#d4edda'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <strong>{dev.usuario?.nome}</strong>
              <p style={{ fontSize: '12px', color: '#666', margin: '5px 0' }}>
                {new Date(dev.dataDevolucao).toLocaleString('pt-BR')}
              </p>
            </div>
            <div>
              {dev.alertaAtivo ? (
                <span style={{ color: '#856404', fontWeight: 'bold' }}>
                  ⚠️ Discrepância: {dev.totalDiscrepancia}
                </span>
              ) : (
                <span style={{ color: '#155724', fontWeight: 'bold' }}>
                  ✅ OK
                </span>
              )}
            </div>
          </div>

          {/* ✅ NOVO: Mostrar observação se existir */}
          {dev.observacao && (
            <div style={{
              marginTop: '10px',
              padding: '10px',
              background: 'rgba(255,255,255,0.7)',
              borderLeft: '3px solid #2196f3',
              fontSize: '14px'
            }}>
              <strong>📝 Observação:</strong>
              <p style={{ margin: '5px 0 0 0' }}>{dev.observacao}</p>
            </div>
          )}

          {/* Detalhes dos itens */}
          <details style={{ marginTop: '10px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              Ver detalhes por produto
            </summary>
            <table style={{ width: '100%', marginTop: '10px', fontSize: '13px' }}>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Esperado</th>
                  <th>Devolvido</th>
                  <th>Diferença</th>
                </tr>
              </thead>
              <tbody>
                {dev.itens?.map(item => (
                  <tr key={item.id}>
                    <td>{item.produto?.nome}</td>
                    <td>{item.quantidadeEsperada}</td>
                    <td>{item.quantidadeDevolvida}</td>
                    <td style={{
                      color: item.discrepancia === 0 ? 'green' : 
                             item.discrepancia > 0 ? 'orange' : 'red',
                      fontWeight: 'bold'
                    }}>
                      {item.discrepancia === 0 ? '✅' : item.discrepancia}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </div>
      ))}
    </div>
  );
}
```

---

## 📋 Checklist de Implementação

### Backend:
- [x] Criar colunas no banco de dados (migration SQL)
- [x] Atualizar modelo CarrinhoUsuario
- [x] Atualizar modelo DevolucaoCarrinho
- [x] Atualizar controller criarCarrinho
- [x] Atualizar controller registrarDevolucao
- [x] Atualizar controller registrarDevolucaoPorAdmin

### Frontend:
- [ ] Adicionar campo `<textarea>` no form de criar carrinho
- [ ] Enviar `observacao` na criação do carrinho (opcional)
- [ ] Exibir observação ao visualizar carrinho
- [ ] Adicionar campo `<textarea>` no form de devolver carrinho
- [ ] Enviar `observacao` na devolução (opcional)
- [ ] Exibir observação no histórico de devoluções
- [ ] Adicionar validação: máximo 500 caracteres

---

## 🧪 Como Testar

### 1. Criar carrinho com observação:
```javascript
POST /api/carrinho-usuarios
{
  "usuarioId": "uuid",
  "itens": [{ "produtoId": "uuid", "quantidade": 10 }],
  "observacao": "Teste de observação"
}
```

### 2. Verificar se observação aparece ao buscar carrinho:
```javascript
GET /api/carrinho-usuarios/atual
// Resposta deve incluir campo "observacao"
```

### 3. Devolver carrinho com observação:
```javascript
POST /api/carrinho-usuarios/devolucao
{
  "carrinhoId": "uuid",
  "itens": [{ "produtoId": "uuid", "quantidadeDevolvida": 8 }],
  "observacao": "Sobrou porque cliente cancelou"
}
```

### 4. Verificar histórico:
```javascript
GET /api/carrinho-usuarios/devolucoes
// Devoluções devem incluir campo "observacao"
```

---

## 💡 Exemplos de Observações

### Na criação do carrinho:
- "Cliente VIP - produtos premium"
- "Evento especial na loja X"
- "Pedido urgente - entregar até 14h"
- "Teste de novos produtos"

### Na devolução:
- "Máquina 5 estava com defeito"
- "Loja estava fechada"
- "Cliente cancelou pedido"
- "Sobrou por chuva forte"
- "Faltou porque máquina tinha mais demanda"

---

## ⚠️ Notas Importantes

### Campo opcional:
- `observacao` é **SEMPRE OPCIONAL**
- Se não enviar, será `null` no banco
- Frontend deve validar comprimento máximo (sugestão: 500 caracteres)

### Observação do admin:
- Quando admin registra devolução por funcionário, a observação é prefixada com:
  ```
  (Registrado por admin@email.com) [observação original]
  ```
- Isso ajuda a rastrear quem fez o registro

### Exibição condicional:
- Sempre verificar `if (observacao)` antes de exibir
- Usar estilo visual destacado (caixa colorida)
- Ícone 📝 ajuda a identificar rapidamente

---

## 📖 Documentação Relacionada

- **Migration SQL:** [MIGRATION_OBSERVACAO_CARRINHOS.sql](./MIGRATION_OBSERVACAO_CARRINHOS.sql)
- **Sistema de Carrinhos:** [SISTEMA_CARRINHOS_POR_PRODUTO.md](./SISTEMA_CARRINHOS_POR_PRODUTO.md)
- **Guia Frontend:** [FRONTEND_ALTERACOES_CARRINHOS.md](./FRONTEND_ALTERACOES_CARRINHOS.md)

---

**✨ Implementação simples e direta - apenas adicione o campo textarea nos forms existentes!**
