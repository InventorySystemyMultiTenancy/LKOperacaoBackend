# 📋 Backend: Endpoint de Histórico de Devoluções

**Data:** 12 de março de 2026  
**Status:** ✅ Implementado

---

## 🎯 Funcionalidade

Endpoint para listar **TODAS as devoluções de carrinhos** (com ou sem discrepância), com suporte a filtros por data e nome do funcionário.

---

## 📡 Endpoint

### **GET** `/api/carrinho-usuarios/devolucoes`

**Autenticação:** `Bearer Token`  
**Permissões:** ADMIN ou emails autorizados

---

## 🔍 Query Parameters (todos opcionais)

| Parâmetro | Tipo | Descrição | Exemplo |
|-----------|------|-----------|---------|
| `dataInicio` | string (ISO 8601) | Data inicial do filtro | `2026-03-01` |
| `dataFim` | string (ISO 8601) | Data final do filtro | `2026-03-12` |
| `usuarioNome` | string | Nome do funcionário (busca parcial, case-insensitive) | `João` |

---

## 📝 Exemplos de Uso

### 1. Buscar todas as devoluções:
```bash
GET /api/carrinho-usuarios/devolucoes
```

### 2. Filtrar por período:
```bash
GET /api/carrinho-usuarios/devolucoes?dataInicio=2026-03-01&dataFim=2026-03-12
```

### 3. Filtrar por nome do funcionário:
```bash
GET /api/carrinho-usuarios/devolucoes?usuarioNome=João
```

### 4. Combinar filtros:
```bash
GET /api/carrinho-usuarios/devolucoes?dataInicio=2026-03-01&dataFim=2026-03-12&usuarioNome=Maria
```

---

## 📤 Formato de Resposta

### Response (200 OK):

```json
[
  {
    "id": "uuid-devolucao",
    "carrinhoId": "uuid-carrinho",
    "usuarioId": "uuid-usuario",
    "quantidadeDevolvida": 95,
    "quantidadeEsperada": 100,
    "discrepancia": -5,
    "alertaAtivo": true,
    "observacao": "Máquina 5 estava com defeito, não consegui abastecer",
    "dataDevolucao": "2026-03-11T18:30:00.000Z",
    "createdAt": "2026-03-11T18:30:00.000Z",
    "updatedAt": "2026-03-11T18:30:00.000Z",
    "usuario": {
      "id": "uuid-usuario",
      "nome": "João Silva",
      "email": "joao@empresa.com"
    },
    "carrinho": {
      "id": "uuid-carrinho",
      "data": "2026-03-11",
      "quantidadeInicial": 100,
      "observacao": "Cliente VIP - urgente"
    },
    "itens": [
      {
        "id": "uuid-item-devolucao",
        "devolucaoId": "uuid-devolucao",
        "produtoId": "uuid-produto",
        "quantidadeDevolvida": 45,
        "quantidadeEsperada": 50,
        "discrepancia": -5,
        "createdAt": "2026-03-11T18:30:00.000Z",
        "updatedAt": "2026-03-11T18:30:00.000Z",
        "produto": {
          "id": "uuid-produto",
          "nome": "Brinquedo A",
          "codigo": "BRQ001"
        }
      },
      {
        "id": "uuid-item-devolucao-2",
        "devolucaoId": "uuid-devolucao",
        "produtoId": "uuid-produto-2",
        "quantidadeDevolvida": 50,
        "quantidadeEsperada": 50,
        "discrepancia": 0,
        "createdAt": "2026-03-11T18:30:00.000Z",
        "updatedAt": "2026-03-11T18:30:00.000Z",
        "produto": {
          "id": "uuid-produto-2",
          "nome": "Brinquedo B",
          "codigo": "BRQ002"
        }
      }
    ]
  },
  {
    "id": "uuid-devolucao-2",
    "carrinhoId": "uuid-carrinho-2",
    "usuarioId": "uuid-usuario-2",
    "quantidadeDevolvida": 80,
    "quantidadeEsperada": 80,
    "discrepancia": 0,
    "alertaAtivo": false,
    "observacao": null,
    "dataDevolucao": "2026-03-10T17:00:00.000Z",
    "createdAt": "2026-03-10T17:00:00.000Z",
    "updatedAt": "2026-03-10T17:00:00.000Z",
    "usuario": {
      "id": "uuid-usuario-2",
      "nome": "Maria Santos",
      "email": "maria@empresa.com"
    },
    "carrinho": {
      "id": "uuid-carrinho-2",
      "data": "2026-03-10",
      "quantidadeInicial": 80,
      "observacao": "Rota especial"
    },
    "itens": [
      {
        "id": "uuid-item-devolucao-3",
        "devolucaoId": "uuid-devolucao-2",
        "produtoId": "uuid-produto",
        "quantidadeDevolvida": 80,
        "quantidadeEsperada": 80,
        "discrepancia": 0,
        "createdAt": "2026-03-10T17:00:00.000Z",
        "updatedAt": "2026-03-10T17:00:00.000Z",
        "produto": {
          "id": "uuid-produto",
          "nome": "Brinquedo A",
          "codigo": "BRQ001"
        }
      }
    ]
  }
]
```

### Response (500 Internal Server Error):

```json
{
  "ok": false,
  "erro": "Erro ao buscar histórico de devoluções",
  "detalhes": "Mensagem de erro específica"
}
```

---

## 📊 Estrutura dos Dados

### Objeto Principal: `Devolução`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | string (UUID) | ID único da devolução |
| `carrinhoId` | string (UUID) | ID do carrinho devolvido |
| `usuarioId` | string (UUID) | ID do funcionário |
| `quantidadeDevolvida` | number | Total de produtos devolvidos |
| `quantidadeEsperada` | number | Total esperado |
| `discrepancia` | number | Diferença (devolvido - esperado) |
| `alertaAtivo` | boolean | Se há alerta de discrepância ativo |
| `observacao` | string \| null | Observação registrada |
| `dataDevolucao` | string (ISO) | Data/hora da devolução |
| `createdAt` | string (ISO) | Data de criação |
| `updatedAt` | string (ISO) | Data de atualização |
| `usuario` | object | Dados do funcionário |
| `carrinho` | object | Dados do carrinho |
| `itens` | array | Lista de itens devolvidos |

### Objeto `usuario`:

```typescript
{
  id: string,      // UUID do usuário
  nome: string,    // Nome completo
  email: string    // Email
}
```

### Objeto `carrinho`:

```typescript
{
  id: string,                  // UUID do carrinho
  data: string,                // Data do carrinho (YYYY-MM-DD)
  quantidadeInicial: number,   // Quantidade inicial
  observacao: string | null    // Observação do carrinho
}
```

### Objeto `itens[]`:

```typescript
{
  id: string,                    // UUID do item
  devolucaoId: string,           // UUID da devolução
  produtoId: string,             // UUID do produto
  quantidadeDevolvida: number,   // Quantidade devolvida
  quantidadeEsperada: number,   // Quantidade esperada
  discrepancia: number,         // Diferença
  createdAt: string,            // Data de criação
  updatedAt: string,            // Data de atualização
  produto: {
    id: string,                 // UUID do produto
    nome: string,               // Nome do produto
    codigo: string              // Código do produto
  }
}
```

---

## 🔍 Lógica de Filtros

### 1. **Sem filtros:**
Retorna **todas as devoluções** ordenadas por `dataDevolucao` DESC

### 2. **Com `dataInicio`:**
Filtra devoluções a partir desta data (inclusive, 00:00:00)

```javascript
WHERE dataDevolucao >= '2026-03-01T00:00:00.000Z'
```

### 3. **Com `dataFim`:**
Filtra devoluções até esta data (inclusive, 23:59:59)

```javascript
WHERE dataDevolucao <= '2026-03-12T23:59:59.999Z'
```

### 4. **Com `usuarioNome`:**
Busca parcial no nome do usuário (case-insensitive)

```javascript
WHERE usuario.nome ILIKE '%João%'
```

### 5. **Combinação:**
Aplica AND entre os filtros

```javascript
WHERE dataDevolucao >= '2026-03-01T00:00:00.000Z'
  AND dataDevolucao <= '2026-03-12T23:59:59.999Z'
  AND usuario.nome ILIKE '%João%'
ORDER BY dataDevolucao DESC
```

---

## 📋 Diferenças entre Endpoints

| Endpoint | Retorna | Uso |
|----------|---------|-----|
| `GET /carrinho-usuarios/alertas` | Apenas devoluções COM discrepância (≠ 0) | Notificar problemas |
| `GET /carrinho-usuarios/devolucoes` | **TODAS** as devoluções | Histórico completo |

---

## 🧪 Como Testar

### 1. Teste básico (todas as devoluções):
```bash
curl -X GET http://localhost:3000/api/carrinho-usuarios/devolucoes \
  -H "Authorization: Bearer SEU_TOKEN"
```

### 2. Teste com filtros:
```bash
curl -X GET "http://localhost:3000/api/carrinho-usuarios/devolucoes?dataInicio=2026-03-01&dataFim=2026-03-12&usuarioNome=João" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### 3. Verificações:
- ✅ Status 200
- ✅ Array de devoluções (pode ser vazio [])
- ✅ Cada devolução com campos obrigatórios
- ✅ `usuario`, `carrinho` e `itens` incluídos
- ✅ `produto` incluído em cada item
- ✅ Ordenado por `dataDevolucao` DESC (mais recente primeiro)
- ✅ `observacao` pode ser `null`

---

## 🎨 Exemplo Frontend (React)

### Componente de Histórico:

```jsx
import React, { useState, useEffect } from 'react';

function HistoricoDevolucoesPage() {
  const [devolucoes, setDevolucoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    dataInicio: '',
    dataFim: '',
    usuarioNome: ''
  });

  const buscarDevolucoes = async () => {
    setLoading(true);
    
    // Construir query string
    const params = new URLSearchParams();
    if (filtros.dataInicio) params.append('dataInicio', filtros.dataInicio);
    if (filtros.dataFim) params.append('dataFim', filtros.dataFim);
    if (filtros.usuarioNome) params.append('usuarioNome', filtros.usuarioNome);
    
    try {
      const response = await fetch(
        `/api/carrinho-usuarios/devolucoes?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setDevolucoes(data);
      } else {
        alert('Erro ao buscar devoluções');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao buscar devoluções');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buscarDevolucoes();
  }, []);

  const handleFiltrar = (e) => {
    e.preventDefault();
    buscarDevolucoes();
  };

  const limparFiltros = () => {
    setFiltros({ dataInicio: '', dataFim: '', usuarioNome: '' });
    // Buscar novamente sem filtros
    setTimeout(() => buscarDevolucoes(), 0);
  };

  if (loading) return <p>Carregando...</p>;

  return (
    <div>
      <h1>Histórico de Devoluções</h1>
      
      {/* Filtros */}
      <form onSubmit={handleFiltrar} style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type="date"
            value={filtros.dataInicio}
            onChange={(e) => setFiltros({...filtros, dataInicio: e.target.value})}
            placeholder="Data início"
          />
          
          <input
            type="date"
            value={filtros.dataFim}
            onChange={(e) => setFiltros({...filtros, dataFim: e.target.value})}
            placeholder="Data fim"
          />
          
          <input
            type="text"
            value={filtros.usuarioNome}
            onChange={(e) => setFiltros({...filtros, usuarioNome: e.target.value})}
            placeholder="Nome do funcionário"
          />
          
          <button type="submit">🔍 Filtrar</button>
          <button type="button" onClick={limparFiltros}>🔄 Limpar</button>
        </div>
      </form>

      {/* Resultados */}
      <p>Total: {devolucoes.length} devolução(ões)</p>

      {devolucoes.length === 0 ? (
        <p>Nenhuma devolução encontrada.</p>
      ) : (
        <div>
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
              {/* Cabeçalho */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div>
                  <strong style={{ fontSize: '18px' }}>{dev.usuario?.nome}</strong>
                  <p style={{ fontSize: '12px', color: '#666', margin: '5px 0' }}>
                    📅 {new Date(dev.dataDevolucao).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {dev.alertaAtivo ? (
                    <span style={{ color: '#856404', fontWeight: 'bold', fontSize: '16px' }}>
                      ⚠️ Discrepância: {dev.discrepancia > 0 ? '+' : ''}{dev.discrepancia}
                    </span>
                  ) : (
                    <span style={{ color: '#155724', fontWeight: 'bold', fontSize: '16px' }}>
                      ✅ Sem Discrepância
                    </span>
                  )}
                </div>
              </div>

              {/* Resumo */}
              <div style={{ fontSize: '14px', marginBottom: '10px' }}>
                <span>Devolvido: <strong>{dev.quantidadeDevolvida}</strong></span>
                {' | '}
                <span>Esperado: <strong>{dev.quantidadeEsperada}</strong></span>
                {' | '}
                <span>Data do carrinho: <strong>{dev.carrinho?.data}</strong></span>
              </div>

              {/* Observações */}
              {dev.observacao && (
                <div style={{
                  padding: '10px',
                  background: 'rgba(255,255,255,0.7)',
                  borderLeft: '3px solid #2196f3',
                  fontSize: '14px',
                  marginBottom: '10px'
                }}>
                  <strong>📝 Observação da devolução:</strong>
                  <p style={{ margin: '5px 0 0 0' }}>{dev.observacao}</p>
                </div>
              )}

              {dev.carrinho?.observacao && (
                <div style={{
                  padding: '10px',
                  background: 'rgba(255,255,255,0.7)',
                  borderLeft: '3px solid #9c27b0',
                  fontSize: '14px',
                  marginBottom: '10px'
                }}>
                  <strong>📝 Observação do carrinho:</strong>
                  <p style={{ margin: '5px 0 0 0' }}>{dev.carrinho.observacao}</p>
                </div>
              )}

              {/* Detalhes dos produtos */}
              <details>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                  📦 Ver produtos ({dev.itens?.length})
                </summary>
                <table style={{ width: '100%', marginTop: '10px', fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Produto</th>
                      <th>Esperado</th>
                      <th>Devolvido</th>
                      <th>Diferença</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dev.itens?.map(item => (
                      <tr key={item.id}>
                        <td>{item.produto?.codigo}</td>
                        <td>{item.produto?.nome}</td>
                        <td>{item.quantidadeEsperada}</td>
                        <td>{item.quantidadeDevolvida}</td>
                        <td style={{
                          color: item.discrepancia === 0 ? 'green' : 
                                 item.discrepancia > 0 ? 'orange' : 'red',
                          fontWeight: 'bold'
                        }}>
                          {item.discrepancia === 0 ? '✅ OK' : 
                           item.discrepancia > 0 ? `+${item.discrepancia}` : 
                           item.discrepancia}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default HistoricoDevolucoesPage;
```

---

## ✅ Implementação Backend

### Arquivo: `src/controllers/carrinhoUsuarioController.js`

```javascript
export const listarHistoricoDevolucoes = async (req, res) => {
  const { dataInicio, dataFim, usuarioNome } = req.query;

  try {
    // Construir filtros dinamicamente
    const where = {};

    // Filtro por data
    if (dataInicio || dataFim) {
      where.dataDevolucao = {};
      
      if (dataInicio) {
        const dataInicioDate = new Date(dataInicio + 'T00:00:00.000Z');
        where.dataDevolucao[Op.gte] = dataInicioDate;
      }
      
      if (dataFim) {
        const dataFimDate = new Date(dataFim + 'T23:59:59.999Z');
        where.dataDevolucao[Op.lte] = dataFimDate;
      }
    }

    // Construir include com filtro de nome
    const includeUsuario = {
      model: db.Usuario,
      as: "usuario",
      attributes: ["id", "nome", "email"],
    };

    if (usuarioNome && usuarioNome.trim()) {
      includeUsuario.where = {
        nome: {
          [Op.iLike]: `%${usuarioNome.trim()}%`,
        },
      };
    }

    // Buscar devoluções
    const devolucoes = await db.DevolucaoCarrinho.findAll({
      where,
      include: [
        includeUsuario,
        {
          model: db.CarrinhoUsuario,
          as: "carrinho",
          attributes: ["id", "data", "quantidadeInicial", "observacao"],
        },
        {
          model: db.DevolucaoCarrinhoItem,
          as: "itens",
          include: [
            {
              model: db.Produto,
              as: "produto",
              attributes: ["id", "nome", "codigo"],
            },
          ],
        },
      ],
      order: [["dataDevolucao", "DESC"]],
    });

    res.json(devolucoes);
  } catch (error) {
    console.error("Erro ao listar histórico de devoluções:", error);
    res.status(500).json({ 
      ok: false, 
      erro: "Erro ao buscar histórico de devoluções",
      detalhes: error.message 
    });
  }
};
```

### Arquivo: `src/routes/carrinhoUsuario.routes.js`

```javascript
import { listarHistoricoDevolucoes } from "../controllers/carrinhoUsuarioController.js";

// Rota
router.get("/devolucoes", autenticar, autorizarAdminOuEmailAutorizado, listarHistoricoDevolucoes);
```

---

## 📖 Documentação Relacionada

- [SISTEMA_CARRINHOS_INDEX.md](./SISTEMA_CARRINHOS_INDEX.md) - Índice geral
- [SISTEMA_CARRINHOS_POR_PRODUTO.md](./SISTEMA_CARRINHOS_POR_PRODUTO.md) - Documentação completa
- [FRONTEND_ALTERACOES_CARRINHOS.md](./FRONTEND_ALTERACOES_CARRINHOS.md) - Guia frontend
- [FRONTEND_OBSERVACAO_CARRINHOS.md](./FRONTEND_OBSERVACAO_CARRINHOS.md) - Campo observação

---

**✅ Backend implementado e pronto para uso!**  
**📅 Deploy realizado em:** 12 de março de 2026
