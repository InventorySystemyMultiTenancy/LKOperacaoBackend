# 🔍 GUIA DE DEBUG - ROTEIROS E MOVIMENTAÇÕES

## Problema Reportado
O botão de "Concluir Roteiro" não está sendo habilitado mesmo após fazer movimentações nas máquinas.

## Sistema de Limite de Movimentações
- **Limite por máquina: 1 movimentação**
- Cada máquina precisa ter exatamente 1 movimentação registrada para ser considerada "atendida"
- O botão "Concluir Roteiro" só é habilitado quando TODAS as máquinas tiverem pelo menos 1 movimentação

---

## PASSO 1: Verificar no DBeaver

### 1.1 - Abra o arquivo `TESTE_ROTEIRO_MOVIMENTACOES.sql` no DBeaver

### 1.2 - Execute o PASSO 1 para ver os roteiros:
```sql
SELECT id, nome, zona, data, status FROM roteiros ORDER BY data DESC LIMIT 10;
```
**Anote o ID do roteiro que você está testando.**

### 1.3 - Configure a variável com o ID do roteiro:
```sql
SET @roteiro_id = 1; -- SUBSTITUA pelo ID do seu roteiro
```

### 1.4 - Execute o PASSO 7 (Resumo Geral):
```sql
-- Esta query mostra EXATAMENTE o que o frontend deveria exibir
SELECT 
    r.id as roteiro_id,
    r.nome as roteiro_nome,
    COUNT(DISTINCT m.id) as total_maquinas,
    COUNT(DISTINCT mov.maquinaId) as maquinas_com_movimentacao,
    COUNT(DISTINCT m.id) - COUNT(DISTINCT mov.maquinaId) as maquinas_pendentes
FROM roteiros r
LEFT JOIN roteiros_lojas rl ON r.id = rl.roteiroId
LEFT JOIN maquinas m ON rl.lojaId = m.lojaId AND m.ativo = true
LEFT JOIN movimentacoes mov ON m.id = mov.maquinaId AND mov.roteiroId = r.id
WHERE r.id = @roteiro_id
GROUP BY r.id;
```

**O que verificar:**
- ✅ `total_maquinas` = Total de máquinas ativas nas lojas do roteiro
- ✅ `maquinas_com_movimentacao` = Máquinas que já têm pelo menos 1 movimentação
- ✅ `maquinas_pendentes` = Máquinas que ainda NÃO têm movimentação

**Para o botão funcionar:** `maquinas_pendentes` deve ser **0** (zero)

### 1.5 - Ver detalhes de cada máquina (PASSO 5):
```sql
SELECT 
    m.id as maquina_id,
    m.codigo,
    m.nome,
    l.nome as loja_nome,
    CASE 
        WHEN mov.maquinaId IS NOT NULL THEN 'SIM - Atendida (1/1)'
        ELSE 'NÃO - Pendente (0/1)'
    END as tem_movimentacao
FROM maquinas m
LEFT JOIN lojas l ON m.lojaId = l.id
LEFT JOIN roteiros_lojas rl ON l.id = rl.lojaId AND rl.roteiroId = @roteiro_id
LEFT JOIN movimentacoes mov ON m.id = mov.maquinaId AND mov.roteiroId = @roteiro_id
WHERE rl.roteiroId = @roteiro_id
AND m.ativo = true
ORDER BY l.nome, m.codigo;
```

**O que verificar:**
- Todas as máquinas devem mostrar "SIM - Atendida (1/1)"
- Se alguma mostrar "NÃO - Pendente (0/1)", essa máquina ainda precisa de movimentação

---

## PASSO 2: Verificar os Logs do Backend

### 2.1 - Abra o terminal do servidor e observe os logs quando você:
1. Criar uma nova movimentação
2. Voltar para a tela ExecutarRoteiro

### 2.2 - Logs esperados ao criar movimentação:
```
📝 [registrarMovimentacao] Criando movimentação: { maquinaId: X, roteiroId: Y, ... }
✅ [registrarMovimentacao] Movimentação criada com sucesso: { id: Z, maquinaId: X, roteiroId: Y, ... }
🔍 [DEBUG] Verificando movimentação no banco para roteiro Y...
📊 [DEBUG] Movimentação verificada: { id: Z, maquinaId: X, roteiroId: Y }
```

### 2.3 - Logs esperados ao carregar roteiro:
```
🔍 [DEBUG] Buscando movimentações para roteiro Y, máquinas: [1, 2, 3, ...]
📊 [DEBUG] Movimentações encontradas: N
📝 [DEBUG] Detalhes das movimentações: [...]
✅ [DEBUG] Máquinas com movimentação (limite 1): [1, 2, 3, ...]
```

**O que verificar:**
- O número de movimentações encontradas deve corresponder ao número de máquinas atendidas
- As máquinas listadas devem ser as que você já fez movimentação

---

## PASSO 3: Verificar no Frontend

### 3.1 - Abra o DevTools do navegador (F12)

### 3.2 - Vá para a aba "Console"

### 3.3 - Acesse a página ExecutarRoteiro

### 3.4 - Clique no botão "🔄 Atualizar Progresso"

### 3.5 - Observe a resposta da API:
```javascript
// Deve aparecer algo assim:
{
  id: 1,
  nome: "Roteiro Teste",
  lojas: [
    {
      id: 1,
      nome: "Loja 1",
      maquinas: [
        { id: 1, codigo: "M001", nome: "Máquina 1", atendida: true },  // ✅ 1/1
        { id: 2, codigo: "M002", nome: "Máquina 2", atendida: false }, // ❌ 0/1
      ]
    }
  ]
}
```

**O que verificar:**
- Cada máquina deve ter `atendida: true` ou `atendida: false`
- Se você fez uma movimentação e `atendida` ainda está `false`, há um problema

---

## PASSO 4: Teste Manual no DBeaver (Se necessário)

### 4.1 - Se as movimentações não estão sendo criadas, crie uma manualmente:

```sql
SET @roteiro_id = 1;  -- ID do seu roteiro
SET @maquina_id = 1;  -- ID de uma máquina que não tem movimentação
SET @usuario_id = 1;  -- ID do seu usuário

INSERT INTO movimentacoes (
    maquinaId, usuarioId, roteiroId, dataColeta,
    totalPre, sairam, abastecidas, totalPos,
    fichas, contadorIn, contadorOut, valorFaturado,
    observacoes, tipoOcorrencia, retiradaEstoque, statusFinanceiro,
    createdAt, updatedAt
) VALUES (
    @maquina_id, @usuario_id, @roteiro_id, NOW(),
    50, 10, 20, 60,
    15, 100, 150, 37.50,
    'Teste manual DBeaver', 'Normal', false, 'concluido',
    NOW(), NOW()
);
```

### 4.2 - Verifique se foi criado:
```sql
SELECT * FROM movimentacoes WHERE roteiroId = @roteiro_id ORDER BY id DESC LIMIT 1;
```

### 4.3 - Volte ao frontend e clique em "🔄 Atualizar Progresso"
- A máquina deveria aparecer como atendida (1/1 mov)

---

## PASSO 5: Possíveis Problemas e Soluções

### Problema 1: Movimentação não está sendo criada
**Sintoma:** Ao registrar movimentação, nada acontece ou dá erro
**Verificar:**
- Console do navegador (F12) - mensagens de erro
- Terminal do servidor - erros de validação
- DBeaver - executar PASSO 4 do TESTE_ROTEIRO_MOVIMENTACOES.sql

**Solução:** Verificar se todos os campos obrigatórios estão sendo enviados

### Problema 2: Movimentação é criada mas não aparece no roteiro
**Sintoma:** A movimentação existe no banco mas a máquina aparece como pendente (0/1)
**Verificar:**
- DBeaver - PASSO 5 e 7 para ver se a movimentação está vinculada ao roteiro correto
- Logs do backend - verificar se `roteiroId` está sendo salvo corretamente

**Solução:** 
```sql
-- Ver se há movimentações sem roteiroId
SELECT * FROM movimentacoes WHERE roteiroId IS NULL;

-- Se houver, atualizar manualmente:
UPDATE movimentacoes 
SET roteiroId = 1  -- ID do seu roteiro
WHERE id = X;      -- ID da movimentação
```

### Problema 3: Frontend não atualiza após criar movimentação
**Sintoma:** Movimentação existe no banco mas frontend não mostra
**Solução:** 
- Clique em "🔄 Atualizar Progresso"
- Ou feche e abra a página novamente
- Verifique se o navegador está usando cache (Ctrl+Shift+R para recarregar sem cache)

### Problema 4: Botão continua desabilitado mesmo com todas as máquinas atendidas
**Sintoma:** Todas mostram (1/1) mas botão não habilita
**Verificar no Console do navegador:**
```javascript
// Copie e cole no Console:
const roteiro = /* dados do roteiro da API */;
const totalMaquinas = roteiro.lojas.reduce((sum, l) => sum + l.maquinas.length, 0);
const atendidas = roteiro.lojas.reduce((sum, l) => sum + l.maquinas.filter(m => m.atendida).length, 0);
console.log('Total:', totalMaquinas, 'Atendidas:', atendidas);
```

---

## CHECKLIST RÁPIDO

Antes de reportar problema, verifique:

- [ ] Executei o script TESTE_ROTEIRO_MOVIMENTACOES.sql no DBeaver
- [ ] Verifiquei que as movimentações estão sendo salvas no banco
- [ ] Confirmei que `roteiroId` está preenchido nas movimentações
- [ ] Verifiquei os logs do backend no terminal
- [ ] Atualizei a página no frontend (🔄 Atualizar Progresso)
- [ ] Limpei o cache do navegador (Ctrl+Shift+R)
- [ ] Todas as máquinas mostram (1/1 mov) no frontend
- [ ] Todas as lojas estão marcadas como concluídas

---

## INFORMAÇÕES IMPORTANTES

### Como funciona o sistema:
1. Você cria uma movimentação em MovimentacoesLoja
2. A movimentação é salva com `roteiroId` e `maquinaId`
3. Ao voltar para ExecutarRoteiro, o backend busca todas as movimentações do roteiro
4. Para cada máquina, verifica se existe pelo menos 1 movimentação
5. Se sim, marca `atendida: true` (limite 1/1 atingido)
6. O frontend conta quantas máquinas estão atendidas
7. Se TODAS as máquinas estiverem atendidas E TODAS as lojas concluídas, o botão é habilitado

### Estrutura de dados esperada:
```javascript
{
  roteiro: {
    id: 1,
    lojas: [
      {
        id: 1,
        maquinas: [
          { id: 1, atendida: true },  // ✅ Tem movimentação (1/1)
          { id: 2, atendida: true },  // ✅ Tem movimentação (1/1)
        ]
      }
    ]
  }
}
```
