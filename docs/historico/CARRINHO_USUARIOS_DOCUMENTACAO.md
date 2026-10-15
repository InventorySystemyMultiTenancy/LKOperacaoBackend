# Sistema de Carrinho de Produtos por Usuário

---

## ⚠️ **DOCUMENTAÇÃO DESATUALIZADA**

**⚡ Este documento descreve a versão ANTIGA do sistema (controle de quantidade total).**

**🆕 A versão NOVA do sistema faz controle POR PRODUTO individual.**

**📖 Consulte a documentação atualizada em:**  
👉 **[SISTEMA_CARRINHOS_POR_PRODUTO.md](./SISTEMA_CARRINHOS_POR_PRODUTO.md)**

**📅 Esta versão antiga foi substituída em: Março 2026**

---

## 📋 Visão Geral (VERSÃO ANTIGA)

Sistema que controla a quantidade de produtos que cada funcionário leva diariamente para fazer as rotas. O sistema desconta automaticamente os produtos usados nas movimentações de abastecimento e verifica se há discrepâncias na devolução.

## 🎯 Funcionamento

### 1. **Admin cria carrinho diário**
- Admin define quantidade X de produtos para o funcionário
- Não é separado por produto específico, apenas quantidade total
- Um funcionário só pode ter um carrinho ativo por dia

### 2. **Sistema desconta automaticamente**
- Quando funcionário faz movimentação de abastecimento, o sistema:
  - Soma todas as quantidades abastecidas
  - Desconta do carrinho do usuário
  - Atualiza `quantidadeAtual` no carrinho

### 3. **Funcionário registra devolução**
- No final do dia, funcionário informa no dashboard:
  - Quantos produtos está devolvendo ao estoque
- Sistema compara:
  - Quantidade devolvida (informada pelo usuário)
  - Quantidade esperada (quantidadeAtual do carrinho)

### 4. **Sistema gera alerta**
- Se quantidade devolvida ≠ quantidade esperada:
  - Gera alerta com discrepância
  - Admin pode ver todos os alertas
  - Admin pode desativar alerta (com botão)

## 🗄️ Estrutura de Dados

### Tabela: `carrinho_usuarios`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| usuario_id | UUID | Usuário dono do carrinho |
| quantidade_inicial | INTEGER | Quantidade total levada no início do dia |
| quantidade_atual | INTEGER | Quantidade atual (vai diminuindo) |
| data | DATE | Data do carrinho |
| ativo | BOOLEAN | Se carrinho está ativo |

**Constraint:** Um usuário só pode ter um carrinho por data (`usuario_id + data` único)

### Tabela: `devolucoes_carrinho`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| carrinho_id | UUID | Referência ao carrinho |
| usuario_id | UUID | Usuário que devolveu |
| quantidade_devolvida | INTEGER | Quantidade informada pelo usuário |
| quantidade_esperada | INTEGER | Quantidade que deveria sobrar |
| discrepancia | INTEGER | Diferença (devolvida - esperada) |
| alerta_ativo | BOOLEAN | Se alerta está ativo |
| observacao | TEXT | Observações |
| data_devolucao | TIMESTAMP | Data/hora da devolução |

**Discrepância:**
- Positiva: Usuário devolveu MAIS do que deveria (sobra)
- Negativa: Usuário devolveu MENOS do que deveria (falta)
- Zero: Está correto

## 🔌 API Endpoints

### 🔑 Permissões

**IMPORTANTE:** Todos os endpoints de gestão de carrinhos (criar, listar, editar, alertas) são acessíveis por:
- Usuários com role `ADMIN`
- **OU** usuários com emails `eriky@clubekids.com` ou `gerson@clubekids.com` (independente do role)

O backend valida: `if (role === 'ADMIN' || email em lista autorizada)`

---

### ADMIN OU EMAILS AUTORIZADOS - Criar carrinho
```http
POST /api/carrinho-usuarios
Authorization: Bearer {token}

Body:
{
  "usuarioId": "uuid",
  "quantidadeInicial": 100,
  "data": "2026-03-10" // opcional, padrão: hoje
}

Response 200:
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
      "id": "uuid",
      "nome": "João Silva",
      "email": "joao@email.com"
    }
  },
  "mensagem": "Carrinho criado com sucesso"
}
```

### ADMIN OU EMAILS AUTORIZADOS - Listar carrinhos
```http
GET /api/carrinho-usuarios?usuarioId=uuid&data=2026-03-10&ativo=true
Authorization: Bearer {token}

Response 200:
{
  "ok": true,
  "carrinhos": [
    {
      "id": "uuid",
      "usuarioId": "uuid",
      "quantidadeInicial": 100,
      "quantidadeAtual": 45,
      "data": "2026-03-10",
      "ativo": true,
      "usuario": { ... },
      "devolucoes": []
    }
  ]
}
```

### ADMIN OU EMAILS AUTORIZADOS - Atualizar carrinho
```http
PUT /api/carrinho-usuarios/:id
Authorization: Bearer {token}

Body:
{
  "quantidadeAtual": 50, // opcional
  "quantidadeInicial": 100, // opcional
  "ativo": false // opcional
}
```

### USUARIO - Meu carrinho atual
```http
GET /api/carrinho-usuarios/meu-carrinho
Authorization: Bearer {token}

Response 200:
{
  "ok": true,
  "carrinho": {
    "id": "uuid",
    "quantidadeInicial": 100,
    "quantidadeAtual": 45,
    "data": "2026-03-10",
    "ativo": true
  }
}

Response 404:
{
  "ok": false,
  "erro": "Nenhum carrinho ativo encontrado para hoje"
}
```

### USUARIO - Status do carrinho (Dashboard)
```http
GET /api/carrinho-usuarios/status
Authorization: Bearer {token}

Response 200:
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

### USUARIO - Registrar devolução
```http
POST /api/carrinho-usuarios/devolucao
Authorization: Bearer {token}

Body:
{
  "carrinhoId": "uuid",
  "quantidadeDevolvida": 40,
  "observacao": "Sobrou 5 unidades na van" // opcional
}

Response 200 (SEM DISCREPÂNCIA):
{
  "ok": true,
  "devolucao": { ... },
  "alertaGerado": false,
  "mensagem": "Devolução registrada com sucesso! Quantidades conferem."
}

Response 200 (COM DISCREPÂNCIA):
{
  "ok": true,
  "devolucao": {
    "id": "uuid",
    "quantidadeDevolvida": 40,
    "quantidadeEsperada": 45,
    "discrepancia": -5,
    "alertaAtivo": true
  },
  "alertaGerado": true,
  "mensagem": "Devolução registrada. ATENÇÃO: Discrepância de -5 produtos (falta)."
}
```

### ADMIN OU EMAILS AUTORIZADOS - Registrar devolução em nome de funcionário (NOVO)
```http
POST /api/carrinho-usuarios/devolucao-admin
Authorization: Bearer {token}

PERMISSÃO: Admin OU usuários com emails "eriky@clubekids.com" e "gerson@clubekids.com"

Body:
{
  "usuarioIdFuncionario": "uuid",
  "quantidadeDevolvida": 40,
  "observacao": "Funcionário saiu mais cedo" // opcional
}

Response 200 (SUCESSO):
{
  "ok": true,
  "devolucao": {
    "id": "uuid",
    "carrinhoId": "uuid",
    "usuarioId": "uuid-funcionario",
    "quantidadeDevolvida": 40,
    "quantidadeEsperada": 45,
    "discrepancia": -5,
    "alertaAtivo": true,
    "observacao": "(Registrado por eriky@clubekids.com) Funcionário saiu mais cedo",
    "dataDevolucao": "2026-03-11T18:30:00Z",
    "carrinho": {
      "data": "2026-03-11",
      "usuario": {
        "nome": "João Silva",
        "email": "joao@email.com"
      }
    }
  },
  "alertaGerado": true,
  "mensagem": "Devolução registrada para João Silva. ATENÇÃO: Discrepância de -5 produtos (falta)."
}

Response 403 (SEM PERMISSÃO):
{
  "error": "Acesso negado. Você não tem permissão para esta ação."
}

Response 404 (CARRINHO NÃO ENCONTRADO):
{
  "ok": false,
  "erro": "Nenhum carrinho ativo encontrado para este funcionário hoje"
}
```

### ADMIN OU EMAILS AUTORIZADOS - Listar alertas de discrepância
```http
GET /api/carrinho-usuarios/alertas?apenasAtivos=true&usuarioId=uuid
Authorization: Bearer {token}

Response 200:
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
      "carrinho": { ... },
      "usuario": { ... }
    }
  ],
  "total": 1,
  "ativos": 1
}
```

### ADMIN OU EMAILS AUTORIZADOS - Desativar alerta
```http
PUT /api/carrinho-usuarios/alertas/:id/desativar
Authorization: Bearer {token}

Body:
{
  "observacao": "Verificado com funcionário, diferença justificada"
}

Response 200:
{
  "ok": true,
  "devolucao": { ... },
  "mensagem": "Alerta desativado com sucesso"
}
```

## 🔄 Fluxo Completo

### Exemplo prático:

1. **Admin cria carrinho (09:00)**
   ```json
   POST /api/carrinho-usuarios
   {
     "usuarioId": "usuario-123",
     "quantidadeInicial": 100
   }
   ```
   - quantidadeInicial: 100
   - quantidadeAtual: 100

2. **Funcionário faz 1ª movimentação (10:00)**
   - Abastece máquina com:
     - 5 unidades produto A
     - 3 unidades produto B
     - 2 unidades produto C
   - **Sistema desconta automaticamente:** 5 + 3 + 2 = 10
   - quantidadeAtual: 90

3. **Funcionário faz 2ª movimentação (11:30)**
   - Abastece máquina com:
     - 8 unidades produto A
     - 7 unidades produto D
   - **Sistema desconta automaticamente:** 8 + 7 = 15
   - quantidadeAtual: 75

4. **Funcionário verifica carrinho (12:00)**
   ```json
   GET /api/carrinho-usuarios/status
   Response: {
     "quantidadeInicial": 100,
     "quantidadeAtual": 75,
     "quantidadeUsada": 25,
     "percentualUsado": 25
   }
   ```

5. **Funcionário faz mais movimentações durante o dia...**
   - Total usado: 55 unidades
   - quantidadeAtual: 45

6. **Funcionário registra devolução (18:00)**
   ```json
   POST /api/carrinho-usuarios/devolucao
   {
     "carrinhoId": "carrinho-123",
     "quantidadeDevolvida": 40
   }
   ```
   
   Sistema calcula:
   - Quantidade esperada: 45 (quantidadeAtual)
   - Quantidade devolvida: 40
   - Discrepância: -5 (falta)
   - **Alerta gerado!**

7. **Admin visualiza alerta (19:00)**
   ```json
   GET /api/carrinho-usuarios/alertas?apenasAtivos=true
   Response: {
     "alertas": [{
       "discrepancia": -5,
       "mensagem": "Faltam 5 unidades"
     }]
   }
   ```

8. **Admin investiga e desativa alerta**
   ```json
   PUT /api/carrinho-usuarios/alertas/alerta-123/desativar
   {
     "observacao": "Produtos ficaram na máquina, conferido."
   }
   ```

## 📊 Integração com Movimentações

O sistema está integrado ao controller de movimentações:

**Arquivo:** `src/controllers/movimentacaoController.js`

Quando uma movimentação é registrada:
1. Sistema verifica se usuário tem carrinho ativo para hoje
2. Se sim, soma todas as `quantidadeAbastecida` dos produtos
3. Desconta essa soma do `quantidadeAtual` do carrinho
4. Registra log no console

**Log de exemplo:**
```
🛒 [registrarMovimentacao] Carrinho atualizado: {
  usuarioId: 'usuario-123',
  quantidadeAnterior: 75,
  totalAbastecido: 15,
  novaQuantidade: 60
}
```

## 🚀 Instalação (Produção)

### 1. Executar SQL no DBeaver (Render)
```sql
-- Execute o arquivo MIGRATION_CARRINHO_USUARIOS.sql
-- no banco de produção (Render)
```

### 2. Commit e Push
```bash
git add .
git commit -m "feat: implementar sistema de carrinho de produtos por usuário"
git push
```

### 3. Aguardar deploy no Render (~2-3 min)

### 4. Testar endpoints
```bash
# Criar carrinho
curl -X POST https://seu-backend.onrender.com/api/carrinho-usuarios \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"usuarioId": "uuid", "quantidadeInicial": 100}'

# Status do carrinho
curl https://seu-backend.onrender.com/api/carrinho-usuarios/status \
  -H "Authorization: Bearer {token}"
```

## 🎨 Frontend - Sugestões de Interface

### Dashboard do Funcionário

**Widget de Carrinho:**
```
┌─────────────────────────────────────┐
│ 🛒 Meu Carrinho de Produtos         │
├─────────────────────────────────────┤
│ Inicial: 100 unidades               │
│ Usado: 55 unidades (55%)            │
│ Restante: 45 unidades               │
│ [█████████████░░░░░░░] 55%          │
├─────────────────────────────────────┤
│ [Registrar Devolução]               │
└─────────────────────────────────────┘
```

**Modal de Devolução:**
```
┌─────────────────────────────────────┐
│ Registrar Devolução                 │
├─────────────────────────────────────┤
│ Quantidade esperada: 45 unidades    │
│                                     │
│ Quanto você está devolvendo?        │
│ [ 45 ] unidades                     │
│                                     │
│ Observações (opcional):             │
│ [                                 ] │
│                                     │
│ [Cancelar] [Confirmar Devolução]    │
└─────────────────────────────────────┘
```

### Dashboard do Admin

**Lista de Alertas:**
```
┌──────────────────────────────────────────────────┐
│ ⚠️ Alertas de Discrepância (3 ativos)           │
├──────────────────────────────────────────────────┤
│ 🔴 João Silva - 10/03 - Falta 5 unidades        │
│    Devolveu: 40 | Esperado: 45                  │
│    [Desativar Alerta]                           │
├──────────────────────────────────────────────────┤
│ 🔴 Maria Santos - 10/03 - Sobra 3 unidades      │
│    Devolveu: 68 | Esperado: 65                  │
│    [Desativar Alerta]                           │
└──────────────────────────────────────────────────┘
```

**Criar Carrinho:**
```
┌─────────────────────────────────────┐
│ Criar Carrinho para Funcionário     │
├─────────────────────────────────────┤
│ Funcionário:                        │
│ [Selecione...▼]                     │
│                                     │
│ Quantidade inicial:                 │
│ [ 100 ] unidades                    │
│                                     │
│ Data:                               │
│ [ 10/03/2026 ]                      │
│                                     │
│ [Cancelar] [Criar Carrinho]         │
└─────────────────────────────────────┘
```

## 📝 Arquivos Criados/Modificados

### Novos arquivos:
- ✅ `src/models/CarrinhoUsuario.js` - Model do carrinho
- ✅ `src/models/DevolucaoCarrinho.js` - Model de devoluções
- ✅ `src/database/migrations/20260310-add-carrinho-usuarios.js` - Migration
- ✅ `src/controllers/carrinhoUsuarioController.js` - Controller
- ✅ `src/routes/carrinhoUsuario.routes.js` - Rotas
- ✅ `MIGRATION_CARRINHO_USUARIOS.sql` - SQL para produção
- ✅ `CARRINHO_USUARIOS_DOCUMENTACAO.md` - Este arquivo

### Modificados:
- ✅ `src/models/index.js` - Adicionado imports e associações
- ✅ `src/routes/index.js` - Adicionado rota de carrinho
- ✅ `src/controllers/movimentacaoController.js` - Desconto automático do carrinho

## 🔒 Permissões

### Apenas Admin:
- Criar carrinho
- Listar todos os carrinhos
- Atualizar carrinho
- Ver todos os alertas
- Desativar alertas

### Funcionário:
- Ver próprio carrinho
- Ver status do carrinho
- Registrar devolução

## ✅ Checklist de Implementação

- [x] Criar models (CarrinhoUsuario, DevolucaoCarrinho)
- [x] Criar migration
- [x] Criar controller com todas as funções
- [x] Criar rotas
- [x] Integrar com movimentacaoController
- [x] Atualizar models/index.js
- [x] Atualizar routes/index.js
- [x] Gerar SQL para produção
- [ ] Executar SQL no banco de produção
- [ ] Fazer commit e push
- [ ] Testar endpoints
- [ ] Implementar frontend
