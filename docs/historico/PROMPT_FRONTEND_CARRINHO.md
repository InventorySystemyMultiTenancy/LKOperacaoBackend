# PROMPT FRONTEND - Sistema de Carrinho de Produtos por Usuário

## 🎯 Objetivo

Implementar interface para controlar a quantidade de produtos que cada funcionário leva diariamente. O sistema deve:
1. Permitir admin **OU usuários autorizados** criar carrinhos diários
2. Mostrar status do carrinho para funcionários
3. Permitir funcionários registrarem devolução ao final do dia
4. Exibir alertas de discrepância para admin/autorizados

### 🔑 Permissões Especiais

**IMPORTANTE:** Além de admins, os seguintes usuários têm acesso completo à gestão de carrinhos:
- `eriky@clubekids.com`
- `gerson@clubekids.com`

Estes usuários podem acessar todas as funcionalidades **independente de serem admin ou não**.

**Código sugerido para verificação:**
```javascript
const userEmail = localStorage.getItem('userEmail');
const isAdmin = localStorage.getItem('userRole') === 'ADMIN';
const temAcessoCarrinhos = isAdmin || 
  ['eriky@clubekids.com', 'gerson@clubekids.com'].includes(userEmail);

// Usar temAcessoCarrinhos para controlar acesso
{temAcessoCarrinhos && <CarrinhosPage />}
```

---

## 📱 Telas a Implementar

### 1. DASHBOARD DO FUNCIONÁRIO

#### Widget de Status do Carrinho
**Localização:** Dashboard principal do funcionário (visível ao logar)

**Endpoint:** `GET /api/carrinho-usuarios/status`

**Request:**
```javascript
const response = await fetch('/api/carrinho-usuarios/status', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();
```

**Response (com carrinho):**
```json
{
  "ok": true,
  "temCarrinho": true,
  "carrinho": {
    "id": "uuid",
    "quantidadeInicial": 100,
    "quantidadeAtual": 45,
    "quantidadeUsada": 55,
    "percentualUsado": 55,
    "data": "2026-03-10"
  }
}
```

**Response (sem carrinho):**
```json
{
  "ok": true,
  "temCarrinho": false,
  "mensagem": "Nenhum carrinho ativo para hoje"
}
```

**UI Sugerida:**
```
┌─────────────────────────────────────┐
│ 🛒 Meu Carrinho de Produtos         │
├─────────────────────────────────────┤
│ Inicial: 100 unidades               │
│ Usado: 55 unidades (55%)            │
│ Restante: 45 unidades               │
│                                     │
│ [████████████░░░░░░░] 55%           │
│                                     │
│ [Registrar Devolução]               │
└─────────────────────────────────────┘
```

**Regras:**
- Mostrar apenas se `temCarrinho === true`
- Se `temCarrinho === false`, não exibir widget ou mostrar mensagem "Nenhum carrinho ativo hoje"
- Atualizar automaticamente ao registrar movimentação
- Barra de progresso colorida:
  - Verde: 0-70% usado
  - Amarelo: 71-90% usado
  - Vermelho: 91-100% usado

---

#### Modal/Página de Devolução
**Trigger:** Botão "Registrar Devolução" no widget

**Endpoint:** `POST /api/carrinho-usuarios/devolucao`

**Request:**
```javascript
const response = await fetch('/api/carrinho-usuarios/devolucao', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    carrinhoId: carrinho.id,
    quantidadeDevolvida: 45,
    observacao: "Opcional"
  })
});
```

**Response (sem discrepância):**
```json
{
  "ok": true,
  "alertaGerado": false,
  "mensagem": "Devolução registrada com sucesso! Quantidades conferem.",
  "devolucao": { ... }
}
```

**Response (com discrepância):**
```json
{
  "ok": true,
  "alertaGerado": true,
  "mensagem": "Devolução registrada. ATENÇÃO: Discrepância de -5 produtos (falta).",
  "devolucao": {
    "quantidadeDevolvida": 40,
    "quantidadeEsperada": 45,
    "discrepancia": -5
  }
}
```

**UI Sugerida:**
```
┌─────────────────────────────────────┐
│ Registrar Devolução de Produtos     │
├─────────────────────────────────────┤
│ 📦 Quantidade esperada no carrinho: │
│     45 unidades                     │
│                                     │
│ Quantos produtos você está          │
│ devolvendo ao estoque?              │
│                                     │
│ [  45  ] unidades                   │
│                                     │
│ Observações (opcional):             │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Cancelar]  [Confirmar Devolução]   │
└─────────────────────────────────────┘
```

**Regras:**
- Campo quantidade já deve vir preenchido com `quantidadeAtual` (sugestão)
- Validar que quantidade >= 0
- Após confirmar:
  - Se `alertaGerado === false`: Mostrar toast verde "✅ Devolução registrada!"
  - Se `alertaGerado === true`: Mostrar toast amarelo "⚠️ Devolução registrada com discrepância"
- Fechar modal/voltar para dashboard
- Widget de carrinho deve desaparecer (carrinho desativado)

---

### 2. DASHBOARD DO ADMIN (OU USUÁRIOS AUTORIZADOS)

#### Seção "Criar Carrinho"
**Localização:** Página de gestão de carrinhos (nova página ou aba)

**Permissão:** Admin OU emails autorizados (`eriky@clubekids.com`, `gerson@clubekids.com`)

**Endpoint:** `POST /api/carrinho-usuarios`

**Request:**
```javascript
const response = await fetch('/api/carrinho-usuarios', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    usuarioId: "uuid-do-funcionario",
    quantidadeInicial: 100,
    data: "2026-03-10" // opcional, padrão: hoje
  })
});
```

**Response (sucesso):**
```json
{
  "ok": true,
  "carrinho": {
    "id": "uuid",
    "usuarioId": "uuid",
    "quantidadeInicial": 100,
    "quantidadeAtual": 100,
    "data": "2026-03-10",
    "ativo": true,
    "usuario": {
      "nome": "João Silva",
      "email": "joao@email.com"
    }
  },
  "mensagem": "Carrinho criado com sucesso"
}
```

**Response (erro - já existe):**
```json
{
  "ok": false,
  "erro": "Já existe um carrinho para este usuário nesta data"
}
```

**UI Sugerida:**
```
┌─────────────────────────────────────┐
│ ➕ Criar Carrinho                   │
├─────────────────────────────────────┤
│ Funcionário: *                      │
│ [Selecione um funcionário... ▼]     │
│                                     │
│ Quantidade inicial: *               │
│ [  100  ] unidades                  │
│                                     │
│ Data:                               │
│ [  10/03/2026  ] (hoje)             │
│                                     │
│ [Limpar]  [Criar Carrinho]          │
└─────────────────────────────────────┘
```

**Regras:**
- Dropdown deve listar apenas funcionários ativos
- Quantidade deve ser > 0
- Data padrão: hoje
- Após criar, mostrar toast e atualizar lista de carrinhos
- Disponível para admin OU usuários autorizados

---

#### Devolver pelo Funcionário (NOVO - Admin ou Usuários Autorizados)
**Localização:** Lista de carrinhos ativos - Botão ao lado de "Editar"

**Permissão:** Admin OU usuários com emails `eriky@clubekids.com` e `gerson@clubekids.com`

**Endpoint:** `POST /api/carrinho-usuarios/devolucao-admin`

Permite que usuários autorizados registrem devoluções **em nome de funcionários** diretamente da lista de carrinhos ativos.

📄 **Ver documentação completa:** [PROMPT_FRONTEND_DEVOLUCAO_ADMIN.md](PROMPT_FRONTEND_DEVOLUCAO_ADMIN.md)

---

#### Editar Carrinho
**Localização:** Modal/página de edição (acionado da lista de carrinhos)

**Endpoint:** `PUT /api/carrinho-usuarios/:id`

**Request:**
```javascript
const response = await fetch(`/api/carrinho-usuarios/${carrinhoId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    quantidadeInicial: 120,
    quantidadeAtual: 50,
    ativo: true
  })
});
```

**Response (sucesso):**
```json
{
  "ok": true,
  "carrinho": {
    "id": "uuid",
    "quantidadeInicial": 120,
    "quantidadeAtual": 50,
    "data": "2026-03-10",
    "ativo": true,
    "usuario": {
      "nome": "João Silva",
      "email": "joao@email.com"
    }
  },
  "mensagem": "Carrinho atualizado com sucesso"
}
```

**UI Sugerida:**
```
┌─────────────────────────────────────┐
│ ✏️ Editar Carrinho                  │
├─────────────────────────────────────┤
│ Funcionário: João Silva             │
│ Data: 10/03/2026                    │
│                                     │
│ Quantidade inicial:                 │
│ [  120  ] unidades                  │
│                                     │
│ Quantidade atual:                   │
│ [  50  ] unidades                   │
│                                     │
│ Status:                             │
│ [ ✓ ] Ativo                         │
│                                     │
│ [Cancelar]  [Salvar Alterações]     │
└─────────────────────────────────────┘
```

**Regras:**
- Apenas admin pode editar carrinhos
- Permite ajustar quantidades em caso de erro ou necessidade de correção
- Pode ativar/desativar carrinho manualmente
- Validar que quantidades >= 0
- Após salvar, mostrar toast e atualizar lista

---

#### Lista de Carrinhos Ativos
**Localização:** Mesma página de gestão

**Endpoint:** `GET /api/carrinho-usuarios?data=2026-03-10&ativo=true`

**Request:**
```javascript
const response = await fetch('/api/carrinho-usuarios?ativo=true', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Response:**
```json
{
  "ok": true,
  "carrinhos": [
    {
      "id": "uuid",
      "quantidadeInicial": 100,
      "quantidadeAtual": 45,
      "data": "2026-03-10",
      "ativo": true,
      "usuario": {
        "nome": "João Silva",
        "email": "joao@email.com"
      },
      "devolucoes": []
    }
  ]
}
```

**UI Sugerida:**
```
┌──────────────────────────────────────────────────────────────┐
│ 📦 Carrinhos Ativos - 10/03/2026                             │
├──────────────────────────────────────────────────────────────┤
│ João Silva                                                   │
│ Inicial: 100 | Atual: 45 | Usado: 55 (55%)                  │
│ [█████████████░░░░░░░] Status: Ativo                         │
│ [✏️ Editar]                                                  │
├──────────────────────────────────────────────────────────────┤
│ Maria Santos                                                 │
│ Inicial: 80 | Atual: 12 | Usado: 68 (85%)                   │
│ [█████████████████░░░] Status: Ativo ⚠️                      │
│ [✏️ Editar]                                                  │
└──────────────────────────────────────────────────────────────┘
```

**Regras:**
- Atualizar a cada 30 segundos (polling) ou usar WebSocket
- Alertar se `percentualUsado > 90%` (ícone ⚠️)
- Ordenar por nome do funcionário
- Botão "Editar" abre modal/página de edição

---

#### Lista de Alertas de Discrepância
**Localização:** Dashboard admin ou página dedicada

**Endpoint:** `GET /api/carrinho-usuarios/alertas?apenasAtivos=true`

**Request:**
```javascript
const response = await fetch('/api/carrinho-usuarios/alertas?apenasAtivos=true', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Response:**
```json
{
  "ok": true,
  "alertas": [
    {
      "id": "uuid",
      "quantidadeDevolvida": 40,
      "quantidadeEsperada": 45,
      "discrepancia": -5,
      "alertaAtivo": true,
      "dataDevolucao": "2026-03-10T18:30:00Z",
      "observacao": null,
      "carrinho": {
        "data": "2026-03-10",
        "quantidadeInicial": 100
      },
      "usuario": {
        "nome": "João Silva",
        "email": "joao@email.com"
      }
    }
  ],
  "total": 5,
  "ativos": 3
}
```

**UI Sugerida:**
```
┌──────────────────────────────────────────────────────────────┐
│ ⚠️ Alertas de Discrepância (3 ativos de 5 total)            │
├──────────────────────────────────────────────────────────────┤
│ 🔴 João Silva - 10/03/2026 - 18:30                          │
│    Devolveu: 40 | Esperado: 45 | Falta: 5 unidades          │
│    [Ver Detalhes] [Desativar Alerta]                        │
├──────────────────────────────────────────────────────────────┤
│ 🟠 Maria Santos - 10/03/2026 - 17:15                        │
│    Devolveu: 68 | Esperado: 65 | Sobra: 3 unidades          │
│    [Ver Detalhes] [Desativar Alerta]                        │
└──────────────────────────────────────────────────────────────┘
```

**Regras:**
- Ícone vermelho 🔴 para falta (discrepancia < 0)
- Ícone laranja 🟠 para sobra (discrepancia > 0)
- Mostrar mais recentes primeiro
- Badge com total de alertas ativos no menu/header

---

#### Desativar Alerta
**Trigger:** Botão "Desativar Alerta" na lista

**Endpoint:** `PUT /api/carrinho-usuarios/alertas/:id/desativar`

**Request:**
```javascript
const response = await fetch(`/api/carrinho-usuarios/alertas/${alertaId}/desativar`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    observacao: "Verificado com funcionário, diferença justificada"
  })
});
```

**UI Sugerida (Modal de Confirmação):**
```
┌─────────────────────────────────────┐
│ Desativar Alerta                    │
├─────────────────────────────────────┤
│ Tem certeza que deseja desativar    │
│ este alerta?                        │
│                                     │
│ Observação (opcional):              │
│ ┌─────────────────────────────────┐ │
│ │ Verificado com funcionário      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Cancelar]  [Confirmar]             │
└─────────────────────────────────────┘
```

**Regras:**
- Após desativar, remover da lista de "ativos"
- Mostrar toast "✅ Alerta desativado"
- Atualizar badge de alertas no header

---

## 🔄 Integração com Movimentações

### Atualização Automática do Carrinho

**IMPORTANTE:** O backend já desconta automaticamente do carrinho quando uma movimentação é registrada. O frontend **NÃO** precisa fazer nada extra.

**Como funciona:**
1. Funcionário registra movimentação normal (endpoint existente)
2. Backend soma todos os `quantidadeAbastecida` dos produtos
3. Backend desconta automaticamente do carrinho
4. Frontend apenas precisa atualizar o widget do carrinho após a movimentação

**Código sugerido após registrar movimentação:**
```javascript
// Após sucesso no POST /api/movimentacoes
async function handleMovimentacaoSuccess() {
  // Atualizar widget do carrinho
  await fetchCarrinhoStatus();
  
  // Mostrar toast
  toast.success('Movimentação registrada e carrinho atualizado!');
}
```

---

## 🎨 Componentes React Sugeridos

### 1. CarrinhoWidget (Funcionário)
```jsx
// components/CarrinhoWidget.jsx
import { useEffect, useState } from 'react';

export function CarrinhoWidget() {
  const [carrinho, setCarrinho] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    const response = await fetch('/api/carrinho-usuarios/status', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    
    if (data.temCarrinho) {
      setCarrinho(data.carrinho);
    }
    setLoading(false);
  }

  if (loading) return <div>Carregando...</div>;
  if (!carrinho) return null;

  const percentage = carrinho.percentualUsado;
  const color = percentage > 90 ? 'red' : percentage > 70 ? 'yellow' : 'green';

  return (
    <div className="carrinho-widget">
      <h3>🛒 Meu Carrinho de Produtos</h3>
      <p>Inicial: {carrinho.quantidadeInicial} unidades</p>
      <p>Usado: {carrinho.quantidadeUsada} ({percentage}%)</p>
      <p>Restante: {carrinho.quantidadeAtual} unidades</p>
      
      <div className="progress-bar">
        <div 
          className={`progress-fill ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <button onClick={() => openDevolucaoModal(carrinho)}>
        Registrar Devolução
      </button>
    </div>
  );
}
```

### 2. DevolucaoModal (Funcionário)
```jsx
// components/DevolucaoModal.jsx
export function DevolucaoModal({ carrinho, onClose, onSuccess }) {
  const [quantidade, setQuantidade] = useState(carrinho.quantidadeAtual);
  const [observacao, setObservacao] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    
    const response = await fetch('/api/carrinho-usuarios/devolucao', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        carrinhoId: carrinho.id,
        quantidadeDevolvida: parseInt(quantidade),
        observacao: observacao || undefined
      })
    });

    const data = await response.json();
    
    if (data.ok) {
      if (data.alertaGerado) {
        toast.warn(data.mensagem);
      } else {
        toast.success(data.mensagem);
      }
      onSuccess();
      onClose();
    } else {
      toast.error(data.erro);
    }
    
    setLoading(false);
  }

  return (
    <Modal>
      <h3>Registrar Devolução de Produtos</h3>
      
      <p>📦 Quantidade esperada: {carrinho.quantidadeAtual} unidades</p>
      
      <label>
        Quantos produtos você está devolvendo?
        <input 
          type="number" 
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
          min="0"
        />
      </label>

      <label>
        Observações (opcional):
        <textarea 
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
        />
      </label>

      <button onClick={onClose}>Cancelar</button>
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Enviando...' : 'Confirmar Devolução'}
      </button>
    </Modal>
  );
}
```

### 3. CriarCarrinhoForm (Admin)
```jsx
// components/admin/CriarCarrinhoForm.jsx
export function CriarCarrinhoForm({ onSuccess }) {
  const [usuarioId, setUsuarioId] = useState('');
  const [quantidade, setQuantidade] = useState(100);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Buscar lista de funcionários
    fetchUsuarios();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    const response = await fetch('/api/carrinho-usuarios', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        usuarioId,
        quantidadeInicial: parseInt(quantidade)
      })
    });

    const data = await response.json();
    
    if (data.ok) {
      toast.success('Carrinho criado com sucesso!');
      setUsuarioId('');
      setQuantidade(100);
      onSuccess();
    } else {
      toast.error(data.erro);
    }
    
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3>➕ Criar Carrinho</h3>
      
      <select 
        value={usuarioId}
        onChange={(e) => setUsuarioId(e.target.value)}
        required
      >
        <option value="">Selecione um funcionário...</option>
        {usuarios.map(u => (
          <option key={u.id} value={u.id}>{u.nome}</option>
        ))}
      </select>

      <input 
        type="number"
        value={quantidade}
        onChange={(e) => setQuantidade(e.target.value)}
        min="1"
        required
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Criando...' : 'Criar Carrinho'}
      </button>
    </form>
  );
}
```

### 4. EditarCarrinhoModal (Admin)
```jsx
// components/admin/EditarCarrinhoModal.jsx
export function EditarCarrinhoModal({ carrinho, onClose, onSuccess }) {
  const [quantidadeInicial, setQuantidadeInicial] = useState(carrinho.quantidadeInicial);
  const [quantidadeAtual, setQuantidadeAtual] = useState(carrinho.quantidadeAtual);
  const [ativo, setAtivo] = useState(carrinho.ativo);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    const response = await fetch(`/api/carrinho-usuarios/${carrinho.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        quantidadeInicial: parseInt(quantidadeInicial),
        quantidadeAtual: parseInt(quantidadeAtual),
        ativo
      })
    });

    const data = await response.json();
    
    if (data.ok) {
      toast.success('Carrinho atualizado com sucesso!');
      onSuccess();
      onClose();
    } else {
      toast.error(data.erro);
    }
    
    setLoading(false);
  }

  return (
    <Modal>
      <h3>✏️ Editar Carrinho</h3>
      
      <p><strong>Funcionário:</strong> {carrinho.usuario?.nome}</p>
      <p><strong>Data:</strong> {formatDate(carrinho.data)}</p>

      <form onSubmit={handleSubmit}>
        <label>
          Quantidade inicial:
          <input 
            type="number"
            value={quantidadeInicial}
            onChange={(e) => setQuantidadeInicial(e.target.value)}
            min="0"
            required
          />
        </label>

        <label>
          Quantidade atual:
          <input 
            type="number"
            value={quantidadeAtual}
            onChange={(e) => setQuantidadeAtual(e.target.value)}
            min="0"
            required
          />
        </label>

        <label>
          <input 
            type="checkbox"
            checked={ativo}
            onChange={(e) => setAtivo(e.target.checked)}
          />
          Ativo
        </label>

        <button type="button" onClick={onClose}>Cancelar</button>
        <button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </form>
    </Modal>
  );
}
```

### 5. AlertasList (Admin)
```jsx
// components/admin/AlertasList.jsx
export function AlertasList() {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlertas();
  }, []);

  async function fetchAlertas() {
    const response = await fetch('/api/carrinho-usuarios/alertas?apenasAtivos=true', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    setAlertas(data.alertas);
    setLoading(false);
  }

  async function desativarAlerta(id, observacao) {
    const response = await fetch(`/api/carrinho-usuarios/alertas/${id}/desativar`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ observacao })
    });

    if (response.ok) {
      toast.success('Alerta desativado');
      fetchAlertas(); // Recarregar lista
    }
  }

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="alertas-list">
      <h3>⚠️ Alertas de Discrepância ({alertas.length} ativos)</h3>
      
      {alertas.length === 0 ? (
        <p>Nenhum alerta ativo</p>
      ) : (
        alertas.map(alerta => (
          <div key={alerta.id} className="alerta-card">
            <span className={alerta.discrepancia < 0 ? 'red' : 'orange'}>
              {alerta.discrepancia < 0 ? '🔴' : '🟠'}
            </span>
            
            <div>
              <strong>{alerta.usuario.nome}</strong> - {formatDate(alerta.dataDevolucao)}
              <p>
                Devolveu: {alerta.quantidadeDevolvida} | 
                Esperado: {alerta.quantidadeEsperada} | 
                {alerta.discrepancia < 0 ? 'Falta' : 'Sobra'}: {Math.abs(alerta.discrepancia)}
              </p>
            </div>

            <button onClick={() => desativarAlerta(alerta.id)}>
              Desativar Alerta
            </button>
          </div>
        ))
      )}
    </div>
  );
}
```

---

## ✅ Checklist de Implementação

### Para Funcionários:
- [ ] Widget de status do carrinho no dashboard
- [ ] Modal/página de registrar devolução
- [ ] Integração com movimentações (atualizar widget após registrar)
- [ ] Validações de formulário
- [ ] Mensagens de sucesso/erro

### Para Admin:
- [ ] Formulário de criar carrinho
- [ ] Modal/formulário de editar carrinho
- [ ] Lista de carrinhos ativos com botão de editar
- [ ] Lista de alertas de discrepância
- [ ] Botão para desativar alertas
- [ ] Badge de alertas no header/menu
- [ ] Atualização automática (polling ou WebSocket)

### Testes:
- [ ] Criar carrinho com sucesso
- [ ] Tentar criar carrinho duplicado (mesmo usuário + data)
- [ ] Editar carrinho existente (ajustar quantidades)
- [ ] Tentar editar carrinho sem ser admin (deve falhar 403)
- [ ] Registrar devolução com quantidade correta (sem alerta)
- [ ] Registrar devolução com discrepância (gera alerta)
- [ ] Desativar alerta
- [ ] Ver carrinho atualizar após movimentação

---

## 🚀 Ordem de Implementação Sugerida

1. **Widget de carrinho** (funcionário) - componente básico
2. **Modal de devolução** (funcionário) - fluxo completo
3. **Criar carrinho** (admin) - gestão básica
4. **Editar carrinho** (admin) - gestão e correções
5. **Lista de alertas** (admin) - monitoramento
6. **Desativar alertas** (admin) - gestão de alertas
7. **Lista de carrinhos ativos** (admin) - dashboard completo
8. **Polish** - loading states, validações, UX

---

## 📝 Notas Importantes

1. **Autenticação:** Todos os endpoints requerem token JWT no header `Authorization: Bearer {token}`

2. **Permissões:** 
   - Funcionários só veem/editam próprio carrinho (via devolução)
   - Admin tem acesso total: criar, editar, listar todos, gerenciar alertas

3. **Edição de carrinho (Admin):** Permite ajustar quantidades em caso de erro de digitação ou necessidade de correção manual. Apenas admin pode editar carrinhos.

4. **Carrinho já descontado automaticamente:** O backend desconta do carrinho quando movimentação é registrada. Frontend só precisa atualizar UI.

5. **Um carrinho por dia:** Sistema impede criar múltiplos carrinhos para mesmo usuário na mesma data.

6. **Carrinho desativa após devolução:** Após registrar devolução, carrinho fica `ativo: false` e widget deve desaparecer.

7. **Discrepância pode ser positiva ou negativa:**
   - Negativa (< 0): Falta produtos
   - Positiva (> 0): Sobra produtos
   - Zero: Correto

---

## 🎨 Design System Sugerido

### Cores:
- **Verde:** Carrinho OK (0-70% usado)
- **Amarelo:** Carrinho atenção (71-90% usado)
- **Vermelho:** Carrinho crítico (91-100% usado) ou falta produtos
- **Laranja:** Sobra produtos

### Ícones:
- 🛒 Carrinho
- 📦 Produtos
- ⚠️ Alerta
- 🔴 Falta
- 🟠 Sobra
- ✅ Sucesso

---

Boa implementação! 🚀
