# 📋 INSTRUÇÕES PARA CONFIGURAR O GERENCIAMENTO DE ROTEIROS

## ✅ Mudanças Implementadas

### Backend (Já Completo)

1. **Novos Endpoints no Controller** ([roteiroController.js](src/controllers/roteiroController.js))
   - `PUT /api/roteiros/:id` - Atualizar nome/zona do roteiro
   - `POST /api/roteiros/:roteiroId/lojas` - Adicionar loja ao roteiro
   - `DELETE /api/roteiros/:roteiroId/lojas/:lojaId` - Remover loja do roteiro
   - `POST /api/roteiros/:roteiroId/lojas/reordenar` - Reordenar lojas
   - `POST /api/roteiros/mover-loja` - Mover loja entre roteiros (drag & drop)
   - `DELETE /api/roteiros/:id` - Deletar roteiro (apenas pendentes)

2. **Rotas Atualizadas** ([roteiro.routes.js](src/routes/roteiro.routes.js))
   - Todas as rotas foram adicionadas e configuradas

### Frontend (Já Completo)

1. **Novo Componente** ([GerenciarRoteiros.jsx](frontend/GerenciarRoteiros.jsx))
   - Interface com drag-and-drop para arrastar lojas entre roteiros
   - Edição inline do nome do roteiro
   - Adicionar/remover lojas de roteiros
   - Deletar roteiros pendentes
   - Visualização de lojas disponíveis (sem roteiro)

2. **Botão Adicionado** ([Roteiros.jsx](frontend/Roteiros.jsx))
   - Botão "⚙️ Gerenciar Roteiros" visível apenas para ADMIN

---

## 🔧 CONFIGURAÇÃO NECESSÁRIA NO FRONTEND

### Adicionar Rota no React Router

Você precisa adicionar a rota para o novo componente no arquivo principal de rotas do seu projeto React. Localize o arquivo onde as rotas são definidas (geralmente `App.jsx`, `App.js`, `main.jsx`, `routes.jsx` ou similar) e adicione:

```jsx
// 1. Importar o novo componente
import { GerenciarRoteiros } from './frontend/GerenciarRoteiros';

// 2. Adicionar a rota dentro de <Routes>
<Route 
  path="/roteiros/gerenciar" 
  element={
    <PrivateRoute adminOnly={true}>
      <GerenciarRoteiros />
    </PrivateRoute>
  } 
/>
```

**Exemplo completo:**

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PrivateRoute } from './frontend/PrivateRoute';
import { Roteiros } from './frontend/Roteiros';
import { GerenciarRoteiros } from './frontend/GerenciarRoteiros'; // ← ADICIONAR
// ... outros imports

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/roteiros" element={<PrivateRoute><Roteiros /></PrivateRoute>} />
        
        {/* ← ADICIONAR ESTA ROTA */}
        <Route 
          path="/roteiros/gerenciar" 
          element={
            <PrivateRoute adminOnly={true}>
              <GerenciarRoteiros />
            </PrivateRoute>
          } 
        />
        
        {/* ... outras rotas */}
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 🗄️ MUDANÇAS NO BANCO DE DADOS (DBeaver)

### ✨ **BOA NOTÍCIA: NENHUMA MUDANÇA NECESSÁRIA!**

A estrutura atual do banco de dados já suporta todas as funcionalidades implementadas:

#### Tabela `roteiros` (já existente)
```sql
-- Campos utilizados:
- id (UUID, PK)
- data (DATE)
- zona (VARCHAR) -- Usado como nome/identificador do roteiro
- estado (VARCHAR)
- cidade (VARCHAR)
- status (VARCHAR) -- 'pendente', 'em_andamento', 'concluido'
- funcionarioId (UUID, FK)
- funcionarioNome (VARCHAR)
- totalMaquinas (INTEGER)
- maquinasConcluidas (INTEGER)
- saldoRestante (DECIMAL)
```

#### Tabela `roteiros_lojas` (já existente)
```sql
-- Campos utilizados:
- id (UUID, PK)
- roteiro_id (UUID, FK) -- Referência ao roteiro
- loja_id (UUID, FK) -- Referência à loja
- concluida (BOOLEAN) -- Status de conclusão
- ordem (INTEGER) -- Ordem da loja no roteiro (suporta reordenação)
```

### ✅ Funcionalidades Suportadas pela Estrutura Atual

1. **Criação de 6 roteiros diários** ✓
   - Campo `zona` armazena "Roteiro #1", "Roteiro #2", etc.
   
2. **Edição do nome do roteiro** ✓
   - Admin pode alterar o campo `zona` para personalizar

3. **Adicionar/Remover lojas** ✓
   - Insert/Delete em `roteiros_lojas`
   - `totalMaquinas` é recalculado automaticamente

4. **Reordenar lojas** ✓
   - Campo `ordem` permite ordenação customizada
   
5. **Mover lojas entre roteiros (drag & drop)** ✓
   - Delete de `roteiros_lojas` no roteiro origem
   - Insert de `roteiros_lojas` no roteiro destino
   - Atualização de `totalMaquinas` em ambos

6. **Deletar roteiros pendentes** ✓
   - Delete em `roteiros` onde `status = 'pendente'`
   - Cascade delete em `roteiros_lojas`

---

## 🎯 Como Usar a Nova Funcionalidade

### Para o Administrador:

1. **Acessar Roteiros**: Vá para a página `/roteiros`

2. **Gerar Roteiros**: Clique em "🔄 Gerar Roteiros do Dia" (cria 6 roteiros automaticamente)

3. **Gerenciar Roteiros**: Clique em "⚙️ Gerenciar Roteiros"

4. **Editar Nome**: Clique no nome do roteiro e digite um novo nome (ex: "Zona Norte", "Equipe A")

5. **Arrastar Lojas**: 
   - Clique e segure uma loja em um roteiro
   - Arraste para outro roteiro
   - Solte para mover

6. **Adicionar Lojas**: Use o dropdown "+ Adicionar loja..." em cada roteiro

7. **Remover Lojas**: Clique no "✕" ao lado de cada loja

8. **Deletar Roteiro**: Clique no "🗑️" no cabeçalho do roteiro (apenas roteiros pendentes)

### Restrições:

- ⚠️ **Apenas roteiros com status "pendente" podem ser editados**
- ⚠️ **Roteiros "em_andamento" ou "concluído" não podem ser modificados**
- ⚠️ **Apenas ADMIN tem acesso ao gerenciamento**

---

## 🚀 Testando

1. Faça login como ADMIN
2. Gere roteiros do dia
3. Clique em "Gerenciar Roteiros"
4. Teste arrastar lojas entre roteiros
5. Teste adicionar/remover lojas
6. Teste editar nomes dos roteiros

---

## 📝 Resumo das Alterações nos Arquivos

### Backend
- ✅ `src/controllers/roteiroController.js` - 6 novos métodos
- ✅ `src/routes/roteiro.routes.js` - 7 novas rotas

### Frontend
- ✅ `frontend/GerenciarRoteiros.jsx` - Novo componente (criado)
- ✅ `frontend/Roteiros.jsx` - Botão "Gerenciar" adicionado
- ⚠️ **Arquivo de rotas do React** - VOCÊ PRECISA ADICIONAR (ver instruções acima)

### Banco de Dados
- ✅ **Nenhuma alteração necessária** - Estrutura atual já suporta tudo!

---

## 🎉 Pronto!

Após adicionar a rota no React Router, você terá um sistema completo de gerenciamento de roteiros com drag-and-drop, totalmente personalizável pelo admin!
