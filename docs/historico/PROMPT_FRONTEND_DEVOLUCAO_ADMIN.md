# PROMPT FRONTEND - Gestão de Carrinhos para Usuários Autorizados

## 🎯 Objetivo

Permitir que usuários autorizados (emails específicos: `eriky@clubekids.com` e `gerson@clubekids.com`) tenham **ACESSO COMPLETO À ABA DE CARRINHOS**, incluindo:

1. ✅ Ver lista de carrinhos ativos
2. ✅ Criar carrinhos para funcionários
3. ✅ Editar carrinhos existentes
4. ✅ Ver alertas de discrepância
5. ✅ Desativar alertas
6. ✅ Registrar devoluções em nome de funcionários

**IMPORTANTE:** Estes usuários NÃO precisam ser admins necessariamente. A permissão é baseada apenas no email, independente do role. Eles têm as **mesmas permissões de um admin** para a gestão de carrinhos.

---

## 🔐 Permissões

**IMPORTANTE:** Apenas usuários com os seguintes emails têm acesso completo à gestão de carrinhos:
- `eriky@clubekids.com`
- `gerson@clubekids.com`

**NÃO é necessário ser admin!** O backend valida: `if (role === 'ADMIN' || email em lista autorizada)`

### Acesso no Frontend

**Onde aplicar:**
- Menu/navegação: Mostrar aba "Carrinhos" se `isAdmin || emailAutorizado`
- Página de carrinhos: Permitir acesso completo se `isAdmin || emailAutorizado`
- Todos os botões e funcionalidades: Mostrar se `isAdmin || emailAutorizado`

**Código sugerido:**
```javascript
const userEmail = localStorage.getItem('userEmail');
const isAdmin = localStorage.getItem('userRole') === 'ADMIN';
const emailsAutorizados = ['eriky@clubekids.com', 'gerson@clubekids.com'];
const temAcessoCarrinhos = isAdmin || emailsAutorizados.includes(userEmail);

// Usar temAcessoCarrinhos para controlar visibilidade
{temAcessoCarrinhos && (
  <MenuItem to="/carrinhos">
    📦 Carrinhos
  </MenuItem>
)}
```

---
## 📄 Documentação de Referência

Para detalhes completos sobre **todas as funcionalidades de gestão de carrinhos**, consulte:
- [PROMPT_FRONTEND_CARRINHO.md](PROMPT_FRONTEND_CARRINHO.md) - Documentação completa do sistema
- [CARRINHO_USUARIOS_DOCUMENTACAO.md](CARRINHO_USUARIOS_DOCUMENTACAO.md) - Documentação da API

---

## 📝 Resumo de Alterações no Frontend

### 1. Menu/Navegação
Mostrar aba "Carrinhos" para admins OU emails autorizados:

```javascript
const userEmail = localStorage.getItem('userEmail');
const isAdmin = localStorage.getItem('userRole') === 'ADMIN';
const temAcessoCarrinhos = isAdmin || 
  ['eriky@clubekids.com', 'gerson@clubekids.com'].includes(userEmail);

{temAcessoCarrinhos && (
  <MenuItem to="/carrinhos">⚡ Carrinhos</MenuItem>
)}
```

### 2. Página de Carrinhos
Permitir acesso completo aos usuários autorizados:

```javascript
// No componente da página de carrinhos
const temAcessoCarrinhos = isAdmin || 
  ['eriky@clubekids.com', 'gerson@clubekids.com'].includes(userEmail);

if (!temAcessoCarrinhos) {
  return <Navigate to="/dashboard" />;
}
```

### 3. Botões e Funcionalidades
Todos os botões que antes verificavam apenas `isAdmin` devem verificar `temAcessoCarrinhos`:

```javascript
{temAcessoCarrinhos && (
  <>
    <Button onClick={abrirModalCriar}>Criar Carrinho</Button>
    <Button onClick={editarCarrinho}>Editar</Button>
    <Button onClick={devolverPorFuncionario}>Devolver pelo Funcionário</Button>
    {/* etc... */}
  </>
)}
```

---

## 📝 Funcionalidades Específicas

As seções abaixo detalham funcionalidades específicas. Consulte [PROMPT_FRONTEND_CARRINHO.md](PROMPT_FRONTEND_CARRINHO.md) para documentação completa de criar, listar e editar carrinhos.

---
## 📋 Alterações Necessárias

### 1. Adicionar botão "Devolver pelo Funcionário" na lista de carrinhos ativos

**Localização:** Página de gestão de carrinhos - Lista de Carrinhos Ativos

**Permissão:** Mostrar para admins OU usuários com email `eriky@clubekids.com` ou `gerson@clubekids.com`

**Antes:**
```
┌──────────────────────────────────────────────────────────────┐
│ 📦 Carrinhos Ativos - 10/03/2026                             │
├──────────────────────────────────────────────────────────────┤
│ João Silva                                                   │
│ Inicial: 100 | Atual: 45 | Usado: 55 (55%)                  │
│ [█████████████░░░░░░░] Status: Ativo                         │
│ [✏️ Editar]                                                  │
└──────────────────────────────────────────────────────────────┘
```

**Depois:**
```
┌──────────────────────────────────────────────────────────────┐
│ 📦 Carrinhos Ativos - 11/03/2026                             │
├──────────────────────────────────────────────────────────────┤
│ João Silva                                                   │
│ Inicial: 100 | Atual: 45 | Usado: 55 (55%)                  │
│ [█████████████░░░░░░░] Status: Ativo                         │
│ [✏️ Editar]  [📦 Devolver pelo Funcionário]                 │
└──────────────────────────────────────────────────────────────┘
```

---

### 2. Criar Modal de Devolução por Admin

**Trigger:** Botão "Devolver pelo Funcionário" na lista

**Endpoint:** `POST /api/carrinho-usuarios/devolucao-admin`

**Request:**
```javascript
const response = await fetch('/api/carrinho-usuarios/devolucao-admin', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    usuarioIdFuncionario: "uuid-do-funcionario",
    quantidadeDevolvida: 45,
    observacao: "Funcionário saiu mais cedo, admin registrou devolução"
  })
});
```

**Response (sucesso - sem discrepância):**
```json
{
  "ok": true,
  "alertaGerado": false,
  "mensagem": "Devolução registrada com sucesso para João Silva! Quantidades conferem.",
  "devolucao": {
    "id": "uuid",
    "carrinhoId": "uuid",
    "usuarioId": "uuid-funcionario",
    "quantidadeDevolvida": 45,
    "quantidadeEsperada": 45,
    "discrepancia": 0,
    "alertaAtivo": false,
    "observacao": "(Registrado por admin eriky@clubekids.com) Funcionário saiu mais cedo",
    "dataDevolucao": "2026-03-11T18:30:00Z",
    "carrinho": {
      "data": "2026-03-11",
      "quantidadeInicial": 100,
      "usuario": {
        "nome": "João Silva",
        "email": "joao@email.com"
      }
    }
  }
}
```

**Response (sucesso - com discrepância):**
```json
{
  "ok": true,
  "alertaGerado": true,
  "mensagem": "Devolução registrada para João Silva. ATENÇÃO: Discrepância de -5 produtos (falta).",
  "devolucao": {
    "quantidadeDevolvida": 40,
    "quantidadeEsperada": 45,
    "discrepancia": -5,
    "alertaAtivo": true,
    "observacao": "(Registrado por admin eriky@clubekids.com) Funcionário saiu mais cedo",
    ...
  }
}
```

**Response (erro - permissão negada):**
```json
{
  "ok": false,
  "erro": "Você não tem permissão para registrar devolução por funcionários. Apenas eriky@clubekids.com e gerson@clubekids.com podem fazer isso."
}
```

**Response (erro - carrinho não encontrado):**
```json
{
  "ok": false,
  "erro": "Nenhum carrinho ativo encontrado para este funcionário hoje"
}
```

**Response (erro - já devolvido):**
```json
{
  "ok": false,
  "erro": "Já existe uma devolução registrada para este carrinho"
}
```

---

### 3. UI do Modal

**Design Sugerido:**
```
┌─────────────────────────────────────────────────────────┐
│ 📦 Devolver Carrinho - João Silva                       │
├─────────────────────────────────────────────────────────┤
│ Você está registrando a devolução EM NOME DO           │
│ funcionário João Silva (joao@email.com)                 │
│                                                         │
│ ⚠️ Esta ação não pode ser desfeita!                     │
│                                                         │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                         │
│ 📊 Informações do Carrinho:                            │
│   • Quantidade inicial: 100 unidades                   │
│   • Quantidade esperada: 45 unidades                   │
│   • Data: 11/03/2026                                   │
│                                                         │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                         │
│ Quantos produtos estão sendo devolvidos? *             │
│ [  45  ] unidades                                       │
│                                                         │
│ Observação (opcional):                                  │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Ex: Funcionário saiu mais cedo                      │ │
│ │                                                     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ℹ️ O sistema registrará automaticamente que esta       │
│    devolução foi feita por você como administrador.    │
│                                                         │
│ [Cancelar]  [Confirmar Devolução]                       │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 Componente React Sugerido

### DevolucaoPorAdminModal.jsx

```jsx
// components/admin/DevolucaoPorAdminModal.jsx
import { useState } from 'react';
import Modal from './Modal'; // Seu componente de modal
import toast from 'react-hot-toast'; // ou biblioteca de notificação que usar

export function DevolucaoPorAdminModal({ carrinho, onClose, onSuccess }) {
  const [quantidade, setQuantidade] = useState(carrinho.quantidadeAtual);
  const [observacao, setObservacao] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    
    // Validação
    if (quantidade < 0) {
      toast.error('Quantidade não pode ser negativa');
      return;
    }

    // Confirmação extra (opcional)
    const confirmacao = window.confirm(
      `Tem certeza que deseja registrar a devolução de ${quantidade} unidades em nome de ${carrinho.usuario.nome}?`
    );
    
    if (!confirmacao) return;

    setLoading(true);

    try {
      const response = await fetch('/api/carrinho-usuarios/devolucao-admin', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          usuarioIdFuncionario: carrinho.usuarioId,
          quantidadeDevolvida: parseInt(quantidade),
          observacao: observacao || undefined
        })
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.erro || 'Erro ao registrar devolução');
      }

      // Sucesso
      if (data.alertaGerado) {
        toast.warn(data.mensagem);
      } else {
        toast.success(data.mensagem);
      }

      onSuccess(); // Atualizar lista de carrinhos
      onClose();
    } catch (error) {
      console.error('Erro ao registrar devolução:', error);
      toast.error(error.message || 'Erro ao registrar devolução');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="devolucao-admin-modal">
        <h3>📦 Devolver Carrinho - {carrinho.usuario?.nome}</h3>
        
        <div className="alerta-info">
          <p>
            Você está registrando a devolução <strong>EM NOME DO funcionário</strong>{' '}
            {carrinho.usuario?.nome} ({carrinho.usuario?.email})
          </p>
          <p className="warning">⚠️ Esta ação não pode ser desfeita!</p>
        </div>

        <hr />

        <div className="info-carrinho">
          <h4>📊 Informações do Carrinho:</h4>
          <ul>
            <li>Quantidade inicial: {carrinho.quantidadeInicial} unidades</li>
            <li>Quantidade esperada: {carrinho.quantidadeAtual} unidades</li>
            <li>Data: {new Date(carrinho.data).toLocaleDateString('pt-BR')}</li>
          </ul>
        </div>

        <hr />

        <form onSubmit={handleSubmit}>
          <label>
            Quantos produtos estão sendo devolvidos? *
            <input
              type="number"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              min="0"
              required
              autoFocus
            />
            <span className="hint">unidades</span>
          </label>

          <label>
            Observação (opcional):
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: Funcionário saiu mais cedo, admin registrou devolução"
              rows={3}
            />
          </label>

          <div className="info-footer">
            ℹ️ O sistema registrará automaticamente que esta devolução foi feita por você.
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Registrando...' : 'Confirmar Devolução'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
```

---

### Atualizar Lista de Carrinhos Ativos

**Modificar o componente de lista para incluir o novo botão:**

```jsx
// components/admin/CarrinhosAtivosList.jsx
import { useState } from 'react';
import { DevolucaoPorAdminModal } from './DevolucaoPorAdminModal';
import { EditarCarrinhoModal } from './EditarCarrinhoModal';

export function CarrinhosAtivosList({ carrinhos, onRefresh }) {
  const [carrinhoParaDevolver, setCarrinhoParaDevolver] = useState(null);
  const [carrinhoParaEditar, setCarrinhoParaEditar] = useState(null);

  // Verificar se usuário tem permissão (admin OU email autorizado)
  const userEmail = localStorage.getItem('userEmail');
  const isAdmin = localStorage.getItem('userRole') === 'ADMIN';
  const temAcessoCarrinhos = isAdmin || ['eriky@clubekids.com', 'gerson@clubekids.com'].includes(userEmail);

  return (
    <div className="carrinhos-ativos-list">
      <h3>📦 Carrinhos Ativos - {new Date().toLocaleDateString('pt-BR')}</h3>

      {carrinhos.length === 0 ? (
        <p>Nenhum carrinho ativo no momento</p>
      ) : (
        carrinhos.map(carrinho => (
          <div key={carrinho.id} className="carrinho-card">
            <div className="carrinho-info">
              <h4>{carrinho.usuario?.nome}</h4>
              <p>
                Inicial: {carrinho.quantidadeInicial} | 
                Atual: {carrinho.quantidadeAtual} | 
                Usado: {carrinho.quantidadeInicial - carrinho.quantidadeAtual} 
                ({Math.round(((carrinho.quantidadeInicial - carrinho.quantidadeAtual) / carrinho.quantidadeInicial) * 100)}%)
              </p>
              
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${((carrinho.quantidadeInicial - carrinho.quantidadeAtual) / carrinho.quantidadeInicial) * 100}%` 
                  }}
                />
              </div>

              <span className={`status ${carrinho.ativo ? 'ativo' : 'inativo'}`}>
                Status: {carrinho.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            <div className="carrinho-actions">
              <button 
                onClick={() => setCarrinhoParaEditar(carrinho)}
                className="btn-secondary"
              >
                ✏️ Editar
              </button>

              {/* Mostrar botão para admins OU usuários autorizados */}
              {temAcessoCarrinhos && (
                <button 
                  onClick={() => setCarrinhoParaDevolver(carrinho)}
                  className="btn-primary"
                >
                  📦 Devolver pelo Funcionário
                </button>
              )}
            </div>
          </div>
        ))
      )}

      {/* Modais */}
      {carrinhoParaEditar && (
        <EditarCarrinhoModal
          carrinho={carrinhoParaEditar}
          onClose={() => setCarrinhoParaEditar(null)}
          onSuccess={() => {
            setCarrinhoParaEditar(null);
            onRefresh();
          }}
        />
      )}

      {carrinhoParaDevolver && (
        <DevolucaoPorAdminModal
          carrinho={carrinhoParaDevolver}
          onClose={() => setCarrinhoParaDevolver(null)}
          onSuccess={() => {
            setCarrinhoParaDevolver(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
```

---

## 🎨 CSS Sugerido

```css
/* DevolucaoPorAdminModal específico */
.devolucao-admin-modal {
  max-width: 600px;
  padding: 2rem;
}

.devolucao-admin-modal h3 {
  margin-bottom: 1rem;
  color: #333;
}

.alerta-info {
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
}

.alerta-info p {
  margin: 0.5rem 0;
  color: #856404;
}

.alerta-info .warning {
  font-weight: bold;
  color: #d32f2f;
}

.info-carrinho {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
}

.info-carrinho h4 {
  margin: 0 0 0.5rem 0;
  color: #555;
}

.info-carrinho ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.info-carrinho li {
  padding: 0.25rem 0;
  color: #666;
}

.info-footer {
  background: #e3f2fd;
  border-left: 4px solid #2196f3;
  padding: 0.75rem;
  margin: 1rem 0;
  font-size: 0.9rem;
  color: #1565c0;
}

.devolucao-admin-modal label {
  display: block;
  margin: 1rem 0;
}

.devolucao-admin-modal label .hint {
  font-size: 0.85rem;
  color: #999;
  margin-left: 0.5rem;
}

.devolucao-admin-modal input[type="number"],
.devolucao-admin-modal textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  margin-top: 0.25rem;
}

.devolucao-admin-modal textarea {
  resize: vertical;
  font-family: inherit;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.modal-actions button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.modal-actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-actions .btn-primary {
  background: #4caf50;
  color: white;
}

.modal-actions .btn-primary:hover:not(:disabled) {
  background: #45a049;
}

.modal-actions button[type="button"] {
  background: #f5f5f5;
  color: #333;
}

.modal-actions button[type="button"]:hover:not(:disabled) {
  background: #e0e0e0;
}

/* Botão na lista de carrinhos */
.carrinho-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.carrinho-actions .btn-primary {
  background: #2196f3;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.carrinho-actions .btn-primary:hover {
  background: #1976d2;
}

.carrinho-actions .btn-secondary {
  background: #ff9800;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.carrinho-actions .btn-secondary:hover {
  background: #f57c00;
}
```

---

## ✅ Checklist de Implementação

### Frontend:
- [ ] Adicionar verificação `temAcessoCarrinhos` no menu/navegação
- [ ] Permitir acesso à página de carrinhos para admins OU emails autorizados
- [ ] Adicionar botão "Devolver pelo Funcionário" ao lado de "Editar" na lista de carrinhos ativos
- [ ] Criar componente `DevolucaoPorAdminModal`
- [ ] Implementar lógica de chamada ao endpoint `POST /api/carrinho-usuarios/devolucao-admin`
- [ ] Adicionar validações de formulário (quantidade >= 0)
- [ ] Implementar confirmação dupla (dialog de confirmação)
- [ ] Exibir mensagens de sucesso/erro apropriadas
- [ ] Atualizar lista de carrinhos após devolução bem-sucedida
- [ ] Adicionar CSS para estilizar modal
- [ ] Aplicar `temAcessoCarrinhos` em todos os botões e funcionalidades

### Testes:
- [ ] Admin pode acessar aba de carrinhos normalmente
- [ ] Usuário autorizado (eriky ou gerson) pode acessar aba de carrinhos
- [ ] Usuário autorizado que NÃO é admin pode:
  - [ ] Ver lista de carrinhos
  - [ ] Criar carrinho
  - [ ] Editar carrinho
  - [ ] Ver alertas
  - [ ] Desativar alertas
  - [ ] Registrar devolução por funcionário
- [ ] Funcionário comum NÃO pode acessar aba de carrinhos (somente seu próprio widget)
- [ ] Devolução com quantidade correta (sem alerta)
- [ ] Devolução com discrepância (gera alerta)
- [ ] Tentar devolver carrinho já devolvido (erro)
- [ ] Carrinho é desativado após devolução

---

## 🔍 Detalhes Importantes

### 1. **Permissão no Backend**
O backend valida se o usuário tem um dos emails autorizados:
- `eriky@clubekids.com`
- `gerson@clubekids.com`

**NÃO é necessário ser admin!** A validação é feita apenas no email.

Se o usuário não tiver um desses emails, receberá erro **403 Forbidden**:
```json
{
  "ok": false,
  "erro": "Você não tem permissão para registrar devolução por funcionários. Apenas eriky@clubekids.com e gerson@clubekids.com podem fazer isso."
}
```

## 🔍 Detalhes Importantes

### 1. **Permissão no Backend**
O backend valida se o usuário é admin **OU** tem um dos emails autorizados:
- `eriky@clubekids.com`
- `gerson@clubekids.com`

**Lógica:** `if (role === 'ADMIN' || email em lista)`

Se o usuário não atender nenhum dos critérios, receberá erro **403 Forbidden**:
```json
{
  "error": "Acesso negado. Você não tem permissão para esta ação."
}
```

### 2. **Acesso Completo à Gestão de Carrinhos**
Usuários autorizados têm acesso a **TODOS** os endpoints de gestão de carrinhos:
- `POST /api/carrinho-usuarios` - Criar carrinho
- `GET /api/carrinho-usuarios` - Listar carrinhos
- `PUT /api/carrinho-usuarios/:id` - Editar carrinho
- `GET /api/carrinho-usuarios/alertas` - Ver alertas
- `PUT /api/carrinho-usuarios/alertas/:id/desativar` - Desativar alerta
- `POST /api/carrinho-usuarios/devolucao-admin` - Devolver por funcionário
O backend adiciona automaticamente um prefixo à observação:
- Com observação: `(Registrado por eriky@clubekids.com) Funcionário saiu mais cedo`
- Sem observação: `Registrado por eriky@clubekids.com`

### 3. **Observação Automática**
O backend adiciona automaticamente um prefixo à observação:
- Com observação: `(Registrado por eriky@clubekids.com) Funcionário saiu mais cedo`
- Sem observação: `Registrado por eriky@clubekids.com`

### 4. **Devolução em Nome do Funcionário**
A devolução fica registrada com o `usuarioId` do funcionário (não do usuário autorizado), para manter histórico correto. O usuário autorizado é identificado apenas na observação.

### 5. **Carrinho Desativado**
Após a devolução, o carrinho fica `ativo: false` e deve desaparecer da lista de "Carrinhos Ativos".

### 6. **Alerta de Discrepância**
Se houver diferença entre quantidade devolvida e esperada, um alerta é gerado automaticamente na tabela `devolucoes_carrinho` com `alertaAtivo: true`.

---

## 🚀 Ordem de Implementação Sugerida

1. **Adicionar botão** na lista de carrinhos ativos (rápido)
2. **Criar modal básico** sem estilização (funcionalidade primeiro)
3. **Implementar lógica** de chamada à API e validações
4. **Adicionar CSS** e melhorias visuais
5. **Testar** todos os cenários
6. **Polimento** e ajustes finais

---

## 📞 Suporte

Se tiver dúvidas ou problemas na implementação:
1. Verifique o console do navegador para erros
2. Verifique a resposta da API no Network tab
3. Confirme que o token está sendo enviado corretamente
4. Confirme que o email do usuário está correto e é um dos autorizados

---

Boa implementação! 🚀
