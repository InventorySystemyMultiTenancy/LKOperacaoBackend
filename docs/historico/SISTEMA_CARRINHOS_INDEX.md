# 📚 Índice: Sistema de Carrinhos

## 🆕 **Nova Versão** (Controle por Produto Individual)

### 📖 Documentação Principal
👉 **[SISTEMA_CARRINHOS_POR_PRODUTO.md](./SISTEMA_CARRINHOS_POR_PRODUTO.md)**  
Documentação completa do novo sistema com:
- Estrutura do banco de dados
- Todos os endpoints da API
- Exemplos de request/response
- Componentes React de exemplo
- Breaking changes
- FAQ

### 🚀 Execução da Migration
👉 **[COMO_EXECUTAR_MIGRATION_CARRINHOS_PRODUTO.md](./COMO_EXECUTAR_MIGRATION_CARRINHOS_PRODUTO.md)**  
Guia passo a passo para executar a migration no banco de dados

### 🎨 Alterações no Frontend
👉 **[FRONTEND_ALTERACOES_CARRINHOS.md](./FRONTEND_ALTERACOES_CARRINHOS.md)**  
**Guia completo** com todas as alterações necessárias no frontend, incluindo componentes React prontos

### 📄 Arquivos de Migration
- **SQL Completo**: [MIGRATION_CARRINHOS_POR_PRODUTO.sql](./MIGRATION_CARRINHOS_POR_PRODUTO.sql)
- **SQL Simplificado** (DBeaver): [MIGRATION_CARRINHOS_POR_PRODUTO_SIMPLES.sql](./MIGRATION_CARRINHOS_POR_PRODUTO_SIMPLES.sql)
- **Script Node.js**: [run-migration-carrinhos-produto.js](./run-migration-carrinhos-produto.js)

---

## 💾 Estrutura de Dados (Nova Versão)

### Modelos Sequelize

#### Novos Modelos
- **[src/models/CarrinhoItem.js](./src/models/CarrinhoItem.js)**  
  Modelo para produtos individuais em cada carrinho

- **[src/models/DevolucaoCarrinhoItem.js](./src/models/DevolucaoCarrinhoItem.js)**  
  Modelo para produtos individuais em cada devolução

#### Relacionamentos
- **[src/models/index.js](./src/models/index.js)**  
  Configuração de todos os relacionamentos entre modelos

---

## 🎮 Controllers (Nova Versão)

### Carrinho de Usuários
📂 **[src/controllers/carrinhoUsuarioController.js](./src/controllers/carrinhoUsuarioController.js)**

**Endpoints atualizados:**
- `POST /api/carrinho-usuarios` - Criar carrinho com array de produtos
- `GET /api/carrinho-usuarios` - Listar carrinhos (inclui produtos)
- `GET /api/carrinho-usuarios/atual` - Buscar carrinho ativo (inclui produtos)
- `POST /api/carrinho-usuarios/devolucao` - Devolução por produto
- `POST /api/carrinho-usuarios/devolucao-admin` - Devolução admin por produto

### Movimentações
📂 **[src/controllers/movimentacaoController.js](./src/controllers/movimentacaoController.js)**

**Funcionalidade adicionada:**
- Desconto automático de produtos do carrinho quando funcionário faz movimentação
- Atualização de `quantidadeAtual` de cada produto no carrinho
- Logs detalhados do processo de desconto

---

## 📊 Diferenças entre Versões

| Aspecto | Versão Antiga | Versão Nova |
|---------|---------------|-------------|
| **Controle** | Quantidade total | Por produto individual |
| **Criação** | `{ quantidadeInicial: 100 }` | `{ itens: [{ produtoId, quantidade }] }` |
| **Movimentação** | Desconto total | Desconto por produto |
| **Devolução** | Quantidade única | Array de produtos devolvidos |
| **Discrepância** | Uma única por carrinho | Uma por produto |
| **Tabelas** | 2 tabelas | 4 tabelas (2 novas) |

---

## 📜 Versão Antiga (Deprecated)

### ⚠️ Documentação Legada
👉 **[CARRINHO_USUARIOS_DOCUMENTACAO.md](./CARRINHO_USUARIOS_DOCUMENTACAO.md)**  
**(DESATUALIZADA - mantida apenas para referência)**

---

## 🔄 Processo de Migração

### Passo a Passo

1. **✅ Código Backend**
   - Modelos criados
   - Controllers atualizados
   - Relacionamentos configurados

2. **⏳ Migration de Banco de Dados** (PRÓXIMO PASSO)
   ```bash
   # Configure DATABASE_URL
   export DATABASE_URL="postgresql://..."
   
   # Execute migration
   node run-migration-carrinhos-produto.js
   ```

3. **⏳ Deploy para Produção**
   ```bash
   git add .
   git commit -m "feat: Sistema de carrinhos por produto individual"
   git push origin main
   # Aguarde Render fazer deploy automático
   ```

4. **⏳ Atualização do Frontend**
   - Atualizar formulários para aceitar múltiplos produtos
   - Atualizar displays para mostrar lista de produtos
   - Consultar exemplos em `SISTEMA_CARRINHOS_POR_PRODUTO.md`

5. **⏳ Testes**
   - Criar carrinho com múltiplos produtos
   - Fazer movimentação e verificar desconto
   - Testar devolução com discrepâncias

---

## 🎯 Quick Start

### Para entender o sistema:
1. Leia **[SISTEMA_CARRINHOS_POR_PRODUTO.md](./SISTEMA_CARRINHOS_POR_PRODUTO.md)**

### Para executar a migration:
1. Leia **[COMO_EXECUTAR_MIGRATION_CARRINHOS_PRODUTO.md](./COMO_EXECUTAR_MIGRATION_CARRINHOS_PRODUTO.md)**
2. Execute `node run-migration-carrinhos-produto.js`

### Para atualizar o frontend:
1. **Leia o guia completo**: **[FRONTEND_ALTERACOES_CARRINHOS.md](./FRONTEND_ALTERACOES_CARRINHOS.md)**
2. Componentes React prontos incluídos
3. Exemplos de código antigo vs novo

---

## 📞 Suporte

- Consulte o **FAQ** em `SISTEMA_CARRINHOS_POR_PRODUTO.md`
- Verifique os **logs do backend** para debugging
- Use **DBeaver** para inspecionar dados no banco

---

**Última atualização:** Março 2026  
**Versão do sistema:** 2.0 (Carrinhos por Produto Individual)
