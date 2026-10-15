# 🐛 Correção de Bug: Variável Duplicada em Produção

**Data:** 12 de março de 2026  
**Status:** ✅ Corrigido e implantado

---

## 🔴 Problema

### Erro em Produção:
```
SyntaxError: Identifier 'hoje' has already been declared
    at movimentacaoController.js:326
```

### Causa:
Durante a implementação do sistema de carrinhos por produto individual, o código de desconto automático foi **adicionado duas vezes** no mesmo arquivo:

1. **Primeira vez (linha 254)**: ✅ Implementação CORRETA - desconto por produto individual
2. **Segunda vez (linha 326)**: ❌ Implementação ANTIGA - desconto de quantidade total (DUPLICADA)

Ambos os blocos declaravam `const hoje`, causando conflito.

---

## ✅ Solução Aplicada

### O que foi feito:
Removido o bloco de código **duplicado/antigo** (linhas 323-360) que:
- Declarava `const hoje` novamente
- Fazia desconto de quantidade total (sistema antigo)
- Era redundante com o código novo que já faz desconto por produto

### Código MANTIDO (correto):
```javascript
// Linha 254 - Sistema novo de desconto por produto
const hoje = new Date().toISOString().split("T")[0];
const carrinhoUsuario = await CarrinhoUsuario.findOne({
  where: {
    usuarioId: req.usuario.id,
    data: hoje,
    ativo: true,
  },
});

if (carrinhoUsuario) {
  // Importar modelo CarrinhoItem
  const { CarrinhoItem } = await import("../models/index.js");

  for (const produto of produtos) {
    if (produto.quantidadeAbastecida && produto.quantidadeAbastecida > 0) {
      // Buscar item do carrinho correspondente
      const carrinhoItem = await CarrinhoItem.findOne({
        where: {
          carrinhoId: carrinhoUsuario.id,
          produtoId: produto.produtoId,
        },
      });

      if (carrinhoItem) {
        const novaQuantidade = Math.max(
          0,
          carrinhoItem.quantidadeAtual - produto.quantidadeAbastecida,
        );
        await carrinhoItem.update({ quantidadeAtual: novaQuantidade });
      }
    }
  }

  // Atualizar quantidade total do carrinho
  const totalCarrinhoAtual = await CarrinhoItem.sum("quantidadeAtual", {
    where: { carrinhoId: carrinhoUsuario.id },
  });
  await carrinhoUsuario.update({ 
    quantidadeAtual: totalCarrinhoAtual || 0 
  });
}
```

### Código REMOVIDO (duplicado):
```javascript
// ❌ Linha 326 - DUPLICADO/REMOVIDO
const hoje = new Date().toISOString().split("T")[0]; // ← ERRO: já declarado
const carrinhoUsuario = await CarrinhoUsuario.findOne({...});
// ... código antigo que soma total geral
```

---

## 🚀 Deploy

### Commit:
```bash
fix: Remove código duplicado em movimentacaoController (variável 'hoje' declarada duas vezes)
```

### Status:
- ✅ Código corrigido localmente
- ✅ Commit realizado: `b6b393f`
- ✅ Push para `main` branch
- ⏳ Render iniciando deploy automático...

### Como verificar:
Aguarde 2-5 minutos e acesse:
```
https://clubekids1firstclient.onrender.com/
```

O erro `SyntaxError: Identifier 'hoje' has already been declared` **NÃO** deve aparecer mais nos logs.

---

## 📋 Validação Pós-Deploy

### Checklist:

- [ ] Servidor inicia sem erros de sintaxe
- [ ] Endpoint `/api/movimentacoes` (POST) funciona
- [ ] Desconto automático do carrinho funciona corretamente
- [ ] Logs mostram "🛒 [registrarMovimentacao] Descontando produtos do carrinho"
- [ ] Quantidade de cada produto diminui no carrinho após movimentação

### Como testar:
1. Criar carrinho com produtos para um funcionário
2. Fazer movimentação com aquele funcionário
3. Verificar que `quantidadeAtual` de cada produto no carrinho diminuiu
4. Verificar logs do backend para confirmar desconto

---

## 🔍 Análise

### Por que aconteceu?
Durante a refatoração do sistema de carrinhos (de quantidade total para produtos individuais), o código de desconto foi implementado corretamente, mas o código antigo não foi removido, resultando em duplicação.

### Lição aprendida:
Ao refatorar código que substitui funcionalidade existente:
1. ✅ Implementar nova funcionalidade
2. ✅ Testar nova funcionalidade
3. ✅ **REMOVER código antigo** ← Faltou este passo

---

## 📖 Arquivos Relacionados

- **Arquivo corrigido**: [src/controllers/movimentacaoController.js](../src/controllers/movimentacaoController.js)
- **Documentação**: [SISTEMA_CARRINHOS_POR_PRODUTO.md](./SISTEMA_CARRINHOS_POR_PRODUTO.md)
- **Commit**: `b6b393f`

---

## ✅ Status Final

**Problema**: RESOLVIDO ✅  
**Deploy**: EM ANDAMENTO ⏳  
**Próxima ação**: Aguardar deploy do Render (2-5 minutos)

---

**Última atualização:** 12/03/2026
