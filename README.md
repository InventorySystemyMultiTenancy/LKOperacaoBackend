# Agarra Mais - Backend API

Sistema de gestão de estoque para máquinas de pelúcia (garra).

## 🚀 Tecnologias

- Node.js v20.18.0
- Express.js
- PostgreSQL
- Sequelize ORM
- JWT Authentication

## 📋 Pré-requisitos

- Node.js 20.x ou superior
- PostgreSQL 12 ou superior
- npm ou yarn

## 🔧 Instalação

1. Clone o repositório e entre na pasta backend:

```bash
cd backend
```

2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações do PostgreSQL.

4. Crie o banco de dados no PostgreSQL:

```sql
CREATE DATABASE agarramais_db;
```

5. Execute o servidor:

```bash
npm run dev
```

O servidor estará rodando em `http://localhost:3001`

## 📚 API Endpoints

### Autenticação

- `POST /api/auth/login` - Login de usuário
- `POST /api/auth/registrar` - Registrar novo usuário
- `GET /api/auth/perfil` - Obter perfil (autenticado)
- `PUT /api/auth/perfil` - Atualizar perfil (autenticado)

### Lojas

- `GET /api/lojas` - Listar lojas
- `GET /api/lojas/:id` - Obter loja por ID
- `POST /api/lojas` - Criar loja (ADMIN)
- `PUT /api/lojas/:id` - Atualizar loja (ADMIN)
- `DELETE /api/lojas/:id` - Deletar loja (ADMIN)

### Máquinas

- `GET /api/maquinas` - Listar máquinas
- `GET /api/maquinas/:id` - Obter máquina por ID
- `GET /api/maquinas/:id/estoque` - Obter estoque atual
- `POST /api/maquinas` - Criar máquina (ADMIN)
- `PUT /api/maquinas/:id` - Atualizar máquina (ADMIN)
- `DELETE /api/maquinas/:id` - Deletar máquina (ADMIN)

### Produtos

- `GET /api/produtos` - Listar produtos
- `GET /api/produtos/categorias` - Listar categorias
- `GET /api/produtos/:id` - Obter produto por ID
- `POST /api/produtos` - Criar produto (ADMIN)
- `PUT /api/produtos/:id` - Atualizar produto (ADMIN)
- `DELETE /api/produtos/:id` - Deletar produto (ADMIN)

### Movimentações

- `GET /api/movimentacoes` - Listar movimentações
- `GET /api/movimentacoes/:id` - Obter movimentação por ID
- `POST /api/movimentacoes` - Registrar movimentação
- `PUT /api/movimentacoes/:id` - Atualizar movimentação
- `DELETE /api/movimentacoes/:id` - Deletar movimentação (ADMIN)

### Relatórios

- `GET /api/relatorios/balanco-semanal` - Balanço semanal
- `GET /api/relatorios/alertas-estoque` - Alertas de estoque baixo
- `GET /api/relatorios/performance-maquinas` - Performance por máquina

### Roteiros (NOVO ✨)

- `GET /api/roteiros` - Listar roteiros do dia
- `POST /api/roteiros/gerar` - Gerar 6 roteiros automáticos
- `GET /api/roteiros/:id` - Obter detalhes de um roteiro
- `POST /api/roteiros/:id/iniciar` - Iniciar roteiro
- `POST /api/roteiros/:roteiroId/lojas/:lojaId/concluir` - Concluir loja
- `POST /api/roteiros/:id/concluir` - Finalizar roteiro

**📖 Documentação completa:** [ROTEIROS_INDEX.md](ROTEIROS_INDEX.md)

### Carrinhos por Produto (NOVO ✨)

Sistema de controle de produtos que cada funcionário leva diariamente, com rastreamento individual por produto.

**Endpoints Admin:**
- `POST /api/carrinho-usuarios` - Criar carrinho com produtos
- `GET /api/carrinho-usuarios` - Listar carrinhos
- `POST /api/carrinho-usuarios/devolucao-admin` - Admin devolver por funcionário
- `GET /api/carrinho-usuarios/alertas` - Listar alertas de discrepância
- `GET /api/carrinho-usuarios/devolucoes` - Histórico completo de devoluções
  - Query params: `?dataInicio=2026-03-01&dataFim=2026-03-12&usuarioNome=João`

**Endpoints Funcionário:**
- `GET /api/carrinho-usuarios/atual` - Buscar carrinho ativo do dia
- `POST /api/carrinho-usuarios/devolucao` - Registrar devolução por produto

**📖 Documentação completa:** [SISTEMA_CARRINHOS_INDEX.md](SISTEMA_CARRINHOS_INDEX.md)  
**🎨 Guia Frontend:** [FRONTEND_ALTERACOES_CARRINHOS.md](FRONTEND_ALTERACOES_CARRINHOS.md)

## 🔐 Autenticação

Todas as rotas (exceto login e registro) requerem autenticação via JWT.

Envie o token no header:

```
Authorization: Bearer SEU_TOKEN_AQUI
```

## 👥 Roles

- **ADMIN**: Acesso total ao sistema
- **FUNCIONARIO**: Acesso limitado às lojas permitidas

## 📝 Exemplo de Uso

### Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@agarramais.com", "senha": "Admin@123"}'
```

### Registrar Movimentação

```bash
curl -X POST http://localhost:3001/api/movimentacoes \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "maquinaId": "uuid-da-maquina",
    "totalPre": 50,
    "sairam": 10,
    "abastecidas": 20,
    "fichas": 25,
    "observacoes": "Tudo ok"
  }'
```

## 🗄️ Modelos de Dados

- **Usuario**: Usuários do sistema (ADMIN/FUNCIONARIO)
- **Loja**: Locais onde as máquinas estão instaladas
- **Maquina**: Máquinas de pelúcia
- **Produto**: Catálogo de prêmios (pelúcias)
- **Movimentacao**: Registros de abastecimento e coleta
- **MovimentacaoProduto**: Detalhamento de produtos por movimentação
- **LogAtividade**: Histórico de ações dos usuários
- **UsuarioLoja**: Controle de permissões (RBAC)
- **Roteiro**: Organização de visitas por zona geográfica (NOVO ✨)
- **RoteiroLoja**: Relacionamento roteiro-loja (NOVO ✨)
- **RoteiroGasto**: Despesas do roteiro (NOVO ✨)

## 📊 Features Implementadas

✅ US01 - Autenticação de Usuário
✅ US02 - Controle de Permissões (RBAC)
✅ US03 - Log de Atividades
✅ US04 - Gestão de Lojas
✅ US05 - Inventário de Máquinas
✅ US06 - Catálogo de Produtos
✅ US07 - Definição de QTD Padrão
✅ US08 - Registro de Abastecimento
✅ US09 - Coleta de Fichas
✅ US10 - Registro de Ocorrências
✅ US11 - Cálculo Automático de Faturamento
✅ US12 - Relatório de Média F/P
✅ US13 - Dashboard de Balanço Semanal
✅ US14 - Alerta de Estoque Baixo
✅ **US15 - Sistema de Roteiros** (NOVO ✨)
  - Geração automática de 6 roteiros por zona
  - Acompanhamento em tempo real
  - Vínculo de movimentações com roteiros
  - Controle de progresso e conclusão

## 🗺️ Sistema de Roteiros

O sistema agora inclui funcionalidade completa de gestão de roteiros para organizar visitas técnicas.

### Quick Start

```bash
# 1. Executar migration
node run-migration-roteiros.js

# 2. Atualizar lojas com zona
# (executar SQL em seed-roteiros-test-data.sql)

# 3. Gerar roteiros
curl -X POST http://localhost:3001/api/roteiros/gerar \
  -H "Authorization: Bearer $TOKEN"
```

### Documentação

📚 **Documentação Completa**: [ROTEIROS_INDEX.md](ROTEIROS_INDEX.md)

Documentos disponíveis:
- [ROTEIROS_RESUMO.md](ROTEIROS_RESUMO.md) - Visão geral executiva
- [ROTEIROS_MIGRATION_GUIDE.md](ROTEIROS_MIGRATION_GUIDE.md) - Guia de instalação
- [ROTEIROS_EXEMPLOS_API.md](ROTEIROS_EXEMPLOS_API.md) - Exemplos práticos
- [ROTEIROS_CHECKLIST.md](ROTEIROS_CHECKLIST.md) - Checklist de validação
- [ROTEIROS_ARQUITETURA.md](ROTEIROS_ARQUITETURA.md) - Arquitetura técnica

## 📄 Licença

MIT
