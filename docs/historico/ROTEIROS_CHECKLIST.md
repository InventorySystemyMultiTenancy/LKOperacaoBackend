# ✅ Checklist de Implementação - Sistema de Roteiros

Use este checklist para garantir que tudo foi implementado corretamente.

## 📋 Pré-Requisitos

- [ ] Servidor Node.js configurado
- [ ] Banco de dados PostgreSQL em execução
- [ ] Conexão com banco testada

## 🗄️ 1. Banco de Dados

### Migration
- [ ] Arquivo `src/database/migrations/add-roteiros-tables.js` criado
- [ ] Executado: `node run-migration-roteiros.js`
- [ ] Verificado que as tabelas foram criadas:
  ```sql
  SELECT table_name FROM information_schema.tables 
  WHERE table_name LIKE 'roteiros%';
  ```
  Deve retornar: `roteiros`, `roteiros_lojas`, `roteiros_gastos`

- [ ] Verificado campo `zona` em lojas:
  ```sql
  SELECT column_name FROM information_schema.columns 
  WHERE table_name = 'lojas' AND column_name = 'zona';
  ```

- [ ] Verificado campo `roteiro_id` em movimentacoes:
  ```sql
  SELECT column_name FROM information_schema.columns 
  WHERE table_name = 'movimentacoes' AND column_name = 'roteiro_id';
  ```

### Dados Iniciais
- [ ] Lojas atualizadas com zona:
  ```sql
  UPDATE lojas SET zona = 'Norte' WHERE cidade IN (...);
  UPDATE lojas SET zona = 'Sul' WHERE cidade IN (...);
  -- etc
  ```

- [ ] Verificado distribuição de zonas:
  ```sql
  SELECT zona, COUNT(*) FROM lojas WHERE ativo = true GROUP BY zona;
  ```

## 📦 2. Models

- [ ] `src/models/Roteiro.js` criado
- [ ] `src/models/RoteiroLoja.js` criado
- [ ] `src/models/RoteiroGasto.js` criado
- [ ] `src/models/Loja.js` atualizado (campo `zona`)
- [ ] `src/models/Movimentacao.js` atualizado (campo `roteiroId`)
- [ ] `src/models/index.js` atualizado (imports e relacionamentos)

### Verificar Imports
```bash
# Deve executar sem erros
node -e "import('./src/models/index.js').then(m => console.log('✅ Models OK'))"
```

## 🎮 3. Controllers

- [ ] `src/controllers/roteiroController.js` criado com todos os endpoints:
  - [ ] `listarRoteiros`
  - [ ] `gerarRoteiros`
  - [ ] `obterRoteiro`
  - [ ] `iniciarRoteiro`
  - [ ] `concluirLoja`
  - [ ] `concluirRoteiro`

- [ ] `src/controllers/movimentacaoController.js` atualizado:
  - [ ] Campo `roteiroId` adicionado ao criar movimentação
  - [ ] Lógica para atualizar `maquinasConcluidas` do roteiro

- [ ] `src/controllers/maquinaController.js` atualizado:
  - [ ] Query param `incluirUltimaMovimentacao` implementado

## 🛣️ 4. Routes

- [ ] `src/routes/roteiro.routes.js` criado
- [ ] `src/routes/index.js` atualizado (rota `/roteiros` registrada)

### Verificar Rotas
```bash
# Inicie o servidor e verifique os logs
npm start
# Deve mostrar: "Servidor rodando na porta 3000"
```

## 🧪 5. Testes

### Teste Manual via curl/Postman

- [ ] **GET /api/roteiros** - Listar roteiros
  ```bash
  curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/roteiros
  ```

- [ ] **POST /api/roteiros/gerar** - Gerar roteiros
  ```bash
  curl -X POST -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/roteiros/gerar
  ```

- [ ] **GET /api/roteiros/:id** - Obter roteiro
  ```bash
  curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/roteiros/{id}
  ```

- [ ] **POST /api/roteiros/:id/iniciar** - Iniciar roteiro
  ```bash
  curl -X POST -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"funcionarioNome":"João Silva"}' \
    http://localhost:3000/api/roteiros/{id}/iniciar
  ```

- [ ] **POST /api/roteiros/:roteiroId/lojas/:lojaId/concluir** - Concluir loja
  ```bash
  curl -X POST -H "Authorization: Bearer $TOKEN" \
    http://localhost:3000/api/roteiros/{roteiroId}/lojas/{lojaId}/concluir
  ```

- [ ] **POST /api/roteiros/:id/concluir** - Concluir roteiro
  ```bash
  curl -X POST -H "Authorization: Bearer $TOKEN" \
    http://localhost:3000/api/roteiros/{id}/concluir
  ```

- [ ] **GET /api/maquinas?lojaId=X&incluirUltimaMovimentacao=true**
  ```bash
  curl -H "Authorization: Bearer $TOKEN" \
    "http://localhost:3000/api/maquinas?lojaId={id}&incluirUltimaMovimentacao=true"
  ```

- [ ] **POST /api/movimentacoes** (com roteiroId)
  ```bash
  curl -X POST -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"maquinaId":"...","roteiroId":"...","totalPre":20,...}' \
    http://localhost:3000/api/movimentacoes
  ```

### Teste Automatizado

- [ ] Atualizar TOKEN em `test-roteiros-endpoints.js`
- [ ] Executar: `node test-roteiros-endpoints.js`
- [ ] Todos os testes passaram sem erros

## 📱 6. Integração Frontend

- [ ] Frontend atualizado para usar novos endpoints
- [ ] Tela de seleção de roteiros implementada
- [ ] Tela de execução de roteiro implementada
- [ ] Campo `roteiroId` sendo enviado nas movimentações
- [ ] Contador de progresso sendo exibido

## ✨ 7. Funcionalidades Extras (Opcional)

- [ ] Endpoint para adicionar gastos ao roteiro
  ```javascript
  POST /api/roteiros/:id/gastos
  Body: { categoria, valor, descricao }
  ```

- [ ] Endpoint para listar gastos do roteiro
  ```javascript
  GET /api/roteiros/:id/gastos
  ```

- [ ] Relatório de roteiros
  ```javascript
  GET /api/relatorios/roteiros?dataInicio=...&dataFim=...
  ```

## 🐛 8. Troubleshooting

### Problemas Comuns

- [ ] **Erro "Não há lojas ativas"**
  - Verificar: `SELECT COUNT(*) FROM lojas WHERE ativo = true AND zona IS NOT NULL`
  - Solução: Atualizar lojas com zona

- [ ] **Erro "Campo zona já existe"**
  - Normal se migration foi executada 2x
  - Verificar: Tabelas foram criadas corretamente

- [ ] **Erro "Roteiros não aparecem no GET"**
  - Verificar: Data do roteiro = data atual?
  - Solução: Passar `?data=YYYY-MM-DD` ou gerar novos roteiros

- [ ] **Erro "maquinasConcluidas não atualiza"**
  - Verificar: Campo `roteiroId` está sendo enviado?
  - Verificar: Lógica no `movimentacaoController.js`

- [ ] **Erro 401 Unauthorized**
  - Verificar: Token está sendo enviado no header?
  - Verificar: Token não expirou?

## 📊 9. Validação Final

Execute estas queries para validar tudo:

```sql
-- 1. Contar roteiros gerados
SELECT COUNT(*) as total_roteiros FROM roteiros;

-- 2. Ver distribuição por zona
SELECT zona, COUNT(*) as total 
FROM roteiros 
WHERE data = CURRENT_DATE 
GROUP BY zona;

-- 3. Ver roteiros com lojas
SELECT 
  r.zona,
  r.status,
  COUNT(DISTINCT rl.loja_id) as lojas,
  COUNT(DISTINCT m.id) as maquinas
FROM roteiros r
LEFT JOIN roteiros_lojas rl ON r.id = rl.roteiro_id
LEFT JOIN maquinas m ON rl.loja_id = m."lojaId" AND m.ativo = true
WHERE r.data = CURRENT_DATE
GROUP BY r.id, r.zona, r.status;

-- 4. Ver movimentações com roteiro
SELECT COUNT(*) as movimentacoes_com_roteiro 
FROM movimentacoes 
WHERE roteiro_id IS NOT NULL;
```

## 📚 10. Documentação

- [ ] `ROTEIROS_MIGRATION_GUIDE.md` revisado
- [ ] `ROTEIROS_IMPLEMENTACAO.md` revisado
- [ ] `ROTEIROS_EXEMPLOS_API.md` revisado
- [ ] README principal atualizado com link para roteiros

## 🎉 Conclusão

Se todos os itens acima estão marcados, a implementação está completa!

### Próximos Passos Recomendados:

1. **Teste em Produção**: Deploy no ambiente de staging primeiro
2. **Monitoramento**: Adicionar logs para rastrear uso dos roteiros
3. **Relatórios**: Implementar dashboard de acompanhamento
4. **Otimizações**: Adicionar cache se necessário
5. **Feedback**: Coletar feedback dos usuários

---

## 🆘 Precisa de Ajuda?

- Consulte os arquivos de documentação na raiz do projeto
- Verifique os logs do servidor: `npm start`
- Execute os testes: `node test-roteiros-endpoints.js`
- Revise o código dos controllers em `src/controllers/`

**Bom trabalho! 🚀**
