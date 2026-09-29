# 🚀 COMEÇAR AQUI - Sistema de Roteiros

**Bem-vindo ao sistema de roteiros!** Este guia rápido vai te ajudar a começar em 5 minutos.

## ⚡ Para Quem Tem Pressa

```bash
# 1. Executar migration
node run-migration-roteiros.js

# 2. Atualizar zonas nas lojas (adapte os IDs)
# Execute os comandos SQL em seed-roteiros-test-data.sql

# 3. Testar
node test-roteiros-endpoints.js
```

✅ **Pronto!** O sistema está funcionando.

---

## 📚 Para Quem Quer Entender Melhor

### Passo 1: Entenda o Sistema (5 min)

Leia: [ROTEIROS_RESUMO.md](ROTEIROS_RESUMO.md)

**O que você vai aprender:**
- O que o sistema faz
- Principais funcionalidades
- Como usar

### Passo 2: Instale (10 min)

Siga: [ROTEIROS_MIGRATION_GUIDE.md](ROTEIROS_MIGRATION_GUIDE.md)

**O que você vai fazer:**
- Executar migration no banco
- Verificar se deu certo
- Configurar dados iniciais

### Passo 3: Teste (5 min)

Execute: [ROTEIROS_CHECKLIST.md](ROTEIROS_CHECKLIST.md)

**O que você vai validar:**
- Tabelas criadas
- Endpoints funcionando
- Dados corretos

### Passo 4: Use (10 min)

Consulte: [ROTEIROS_EXEMPLOS_API.md](ROTEIROS_EXEMPLOS_API.md)

**O que você vai aprender:**
- Como chamar cada endpoint
- Exemplos práticos em código
- Casos de uso completos

---

## 🎯 Por Perfil

### 👨‍💼 Gerente/Product Owner

**Tempo total: 5 minutos**

1. Leia [ROTEIROS_RESUMO.md](ROTEIROS_RESUMO.md) - Visão geral
2. Confira [ROTEIROS_ARQUITETURA.md](ROTEIROS_ARQUITETURA.md) - Diagramas e fluxos

### 👨‍💻 Desenvolvedor Backend

**Tempo total: 30 minutos**

1. Leia [ROTEIROS_RESUMO.md](ROTEIROS_RESUMO.md) - 5 min
2. Execute [ROTEIROS_MIGRATION_GUIDE.md](ROTEIROS_MIGRATION_GUIDE.md) - 10 min
3. Valide [ROTEIROS_CHECKLIST.md](ROTEIROS_CHECKLIST.md) - 10 min
4. Estude [ROTEIROS_ARQUITETURA.md](ROTEIROS_ARQUITETURA.md) - 15 min

### 🎨 Desenvolvedor Frontend

**Tempo total: 20 minutos**

1. Leia [ROTEIROS_RESUMO.md](ROTEIROS_RESUMO.md) - 5 min
2. Estude [ROTEIROS_EXEMPLOS_API.md](ROTEIROS_EXEMPLOS_API.md) - 15 min
3. Teste com o script: `node test-roteiros-endpoints.js`

### 🧪 QA/Testes

**Tempo total: 25 minutos**

1. Execute a migration: `node run-migration-roteiros.js` - 5 min
2. Siga [ROTEIROS_CHECKLIST.md](ROTEIROS_CHECKLIST.md) - 15 min
3. Use [ROTEIROS_EXEMPLOS_API.md](ROTEIROS_EXEMPLOS_API.md) para casos de teste - 10 min

---

## 🆘 Precisa de Ajuda?

### ❓ Perguntas Frequentes

**P: Já executei a migration, mas deu erro de "campo já existe"**
R: Normal! A migration é idempotente. Se as tabelas foram criadas, está tudo certo.

**P: Gerei roteiros mas não aparece nenhum**
R: Verifique se as lojas têm o campo `zona` preenchido. Use: `SELECT * FROM lojas WHERE zona IS NULL`

**P: Como testo os endpoints?**
R: Atualize o TOKEN em `test-roteiros-endpoints.js` e execute: `node test-roteiros-endpoints.js`

**P: Onde encontro exemplos de código?**
R: [ROTEIROS_EXEMPLOS_API.md](ROTEIROS_EXEMPLOS_API.md) tem exemplos completos em curl e JavaScript

### 🔍 Documentação Completa

Índice de toda documentação: [ROTEIROS_INDEX.md](ROTEIROS_INDEX.md)

---

## ✅ Checklist Rápido

Marque conforme for concluindo:

- [ ] Migration executada (`node run-migration-roteiros.js`)
- [ ] Tabelas criadas (verificar com SQL)
- [ ] Lojas com zona preenchida
- [ ] Roteiros gerados (`POST /api/roteiros/gerar`)
- [ ] Endpoints testados (`node test-roteiros-endpoints.js`)
- [ ] Documentação lida
- [ ] Frontend integrado (se aplicável)

---

## 🎉 Tudo Certo?

Se você completou o checklist acima, **parabéns!** 🎊

O sistema de roteiros está instalado e funcionando.

### Próximos Passos

1. **Integre com o frontend**: Use os exemplos em [ROTEIROS_EXEMPLOS_API.md](ROTEIROS_EXEMPLOS_API.md)
2. **Teste em produção**: Deploy no ambiente de staging primeiro
3. **Colete feedback**: Peça retorno dos usuários

---

## 📞 Contato e Suporte

- **Dúvidas técnicas**: Consulte [ROTEIROS_INDEX.md](ROTEIROS_INDEX.md)
- **Problemas**: Veja seção Troubleshooting em [ROTEIROS_CHECKLIST.md](ROTEIROS_CHECKLIST.md)
- **Exemplos**: [ROTEIROS_EXEMPLOS_API.md](ROTEIROS_EXEMPLOS_API.md)

---

**Boa sorte! 🚀**

*Sistema de Roteiros v1.0 - Janeiro 2026*
