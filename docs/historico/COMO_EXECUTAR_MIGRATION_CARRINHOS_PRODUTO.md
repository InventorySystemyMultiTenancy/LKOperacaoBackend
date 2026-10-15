# 🚀 Guia de Execução: Migration Carrinhos por Produto

## 📝 O que esta migration faz?

Esta migration adiciona duas novas tabelas ao banco de dados para permitir o controle de **produtos individuais** nos carrinhos dos funcionários:

- **`carrinho_itens`**: Armazena cada produto individual no carrinho
- **`devolucao_carrinho_itens`**: Armazena cada produto devolvido individualmente

## ⚙️ Pré-requisitos

- ✅ Node.js instalado
- ✅ Variável de ambiente `DATABASE_URL` configurada
- ✅ Acesso ao banco de dados PostgreSQL
- ✅ Pacote `pg` instalado (`npm install pg`)

## 🔧 Como executar

### 1️⃣ Configure a DATABASE_URL

**No Windows (PowerShell):**
```powershell
$env:DATABASE_URL="postgresql://usuario:senha@host:porta/database"
```

**No Windows (CMD):**
```cmd
set DATABASE_URL=postgresql://usuario:senha@host:porta/database
```

**No Linux/Mac:**
```bash
export DATABASE_URL="postgresql://usuario:senha@host:porta/database"
```

### 2️⃣ Execute a migration

```bash
node run-migration-carrinhos-produto.js
```

### 3️⃣ Verifique o resultado

Se tudo correu bem, você verá:

```
✅ Migration executada com sucesso!

📊 Tabelas criadas:
   ✓ carrinho_itens - Produtos individuais em cada carrinho
   ✓ devolucao_carrinho_itens - Produtos individuais em cada devolução
```

## 🔍 Verificar tabelas criadas

Execute no DBeaver ou psql:

```sql
-- Verificar tabelas
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('carrinho_itens', 'devolucao_carrinho_itens');

-- Ver estrutura da tabela carrinho_itens
\d carrinho_itens

-- Ver estrutura da tabela devolucao_carrinho_itens
\d devolucao_carrinho_itens
```

## ⚠️ Importante

### ⚡ Esta migration é **ADITIVA**
- Não remove nem modifica tabelas existentes
- Apenas adiciona duas novas tabelas
- É seguro executar em produção

### 🔄 Compatibilidade
- Os carrinhos antigos (sem produtos separados) continuarão funcionando
- Novos carrinhos devem ser criados com a nova estrutura de produtos
- Frontend precisa ser atualizado para usar a nova API

## 📖 Documentação completa

Consulte toda a documentação do novo sistema em:
👉 **[SISTEMA_CARRINHOS_POR_PRODUTO.md](./SISTEMA_CARRINHOS_POR_PRODUTO.md)**

## 🐛 Troubleshooting

### Erro: "DATABASE_URL não está definida"
▶️ Configure a variável de ambiente conforme passo 1

### Erro: "relation already exists"
▶️ As tabelas já foram criadas. Migration já foi executada.

### Erro: "connection refused"
▶️ Verifique se o banco de dados está acessível
▶️ Verifique usuário, senha e host na DATABASE_URL

### Erro: "permission denied"
▶️ Usuário do banco precisa ter permissão CREATE TABLE

## 📋 Próximos passos após a migration

1. ✅ Fazer commit das alterações no código
2. ✅ Fazer push para o repositório
3. ✅ Deploy no Render (automático ou manual)
4. ✅ Atualizar o frontend para usar nova API
5. ✅ Testar criação de carrinho com produtos
6. ✅ Testar movimentação com desconto de produtos
7. ✅ Testar devolução por produto

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs da migration
2. Consulte a documentação completa
3. Verifique se as constraints e índices foram criados corretamente
