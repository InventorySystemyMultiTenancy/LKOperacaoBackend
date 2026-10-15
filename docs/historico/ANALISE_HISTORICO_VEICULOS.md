# 🔍 ANÁLISE: Histórico de Movimentações de Veículos

**Data:** 12 de março de 2026  
**Status:** ✅ BACKEND CORRETO - Problema pode estar no FRONTEND ou CRIAÇÃO

---

## 📊 Resultado da Análise do Backend

### ✅ Endpoint GET está CORRETO

O endpoint `GET /api/movimentacao-veiculos` **NÃO filtra por tipo**:

```javascript
// src/controllers/movimentacaoVeiculoController.js (linha 160)
export const listarMovimentacoesVeiculo = async (req, res) => {
  try {
    const { veiculoId, dataInicio, dataFim } = req.query;
    const where = {};
    
    if (veiculoId) where.veiculoId = veiculoId;
    // Filtros de data...
    
    // ✅ NÃO HÁ FILTRO DE TIPO AQUI!
    const movimentacoes = await MovimentacaoVeiculo.findAll({
      where,  // Sem where.tipo = 'devolucao'
      include: [
        { model: Veiculo, as: "veiculo", attributes: ["id", "nome", "modelo"] },
        { model: Usuario, as: "usuario", attributes: ["id", "nome", "email"] }
      ],
      order: [["dataMovimentacao", "DESC"]]
    });
    
    res.json(movimentacoes);
  } catch (error) {
    console.error("Erro ao listar movimentações de veículo:", error);
    res.status(500).json({ error: "Erro ao listar movimentações de veículo" });
  }
};
```

**Conclusão:** O backend retorna TODAS as movimentações (retiradas + devoluções).

---

## 🔎 Possíveis Causas do Problema

### 1. ❌ Retiradas não estão sendo CRIADAS no banco

**Teste:**
```sql
-- Execute no DBeaver:
SELECT tipo, COUNT(*) as quantidade
FROM movimentacao_veiculos
GROUP BY tipo;
```

**Se retornar apenas 'devolucao':**
- O problema é na criação (endpoint POST)
- Verificar se frontend envia `tipo: "retirada"` correto
- Verificar se há validação que bloqueia retiradas

### 2. ❌ Frontend filtra apenas devoluções

**Verificar no código frontend:**
```javascript
// ❌ Se o frontend fizer isso, só mostrará devoluções:
const movimentacoes = await api.get('/api/movimentacao-veiculos');
const devolucoes = movimentacoes.data.filter(m => m.tipo === 'devolucao');
```

**Solução:**
```javascript
// ✅ Mostrar TODAS:
const movimentacoes = await api.get('/api/movimentacao-veiculos');
// Usar movimentacoes.data diretamente
```

### 3. ❌ Problema de permissões

Verificar se o usuário logado tem permissão para ver retiradas.

---

## 🧪 Plano de Diagnóstico

### Passo 1: Verificar Banco de Dados

Execute o arquivo **[DIAGNOSTICO_MOVIMENTACAO_VEICULOS.sql](DIAGNOSTICO_MOVIMENTACAO_VEICULOS.sql)** no DBeaver:

```sql
-- Query principal:
SELECT 
  tipo,
  COUNT(*) as quantidade
FROM movimentacao_veiculos
GROUP BY tipo
ORDER BY tipo;
```

**Interpretação:**
- ✅ Se aparecer `retirada` e `devolucao` → Problema é no FRONTEND
- ❌ Se aparecer apenas `devolucao` → Problema é na CRIAÇÃO (POST)

### Passo 2: Testar Endpoint Diretamente

```bash
# No Postman ou curl:
curl -X GET "https://clubekids1firstclient.onrender.com/api/movimentacao-veiculos" \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Verificar:**
- Resposta inclui objetos com `"tipo": "retirada"`?
- Resposta inclui objetos com `"tipo": "devolucao"`?

### Passo 3: Verificar Frontend

No código frontend, buscar por:
- `filter(m => m.tipo === 'devolucao')`
- `.tipo === 'devolucao'`
- Qualquer lógica que oculte retiradas

---

## ✅ Confirmação de Funcionamento Correto

Se o backend estiver funcionando corretamente, você deve ver:

```json
[
  {
    "id": "uuid-1",
    "veiculoId": "uuid-veiculo",
    "usuarioId": "uuid-user",
    "tipo": "retirada",
    "km": 1000,
    "dataMovimentacao": "2026-03-12T08:00:00.000Z",
    "usuario": { "nome": "João" },
    "veiculo": { "nome": "CG Start" }
  },
  {
    "id": "uuid-2",
    "veiculoId": "uuid-veiculo",
    "usuarioId": "uuid-user",
    "tipo": "devolucao",
    "km": 1050,
    "dataMovimentacao": "2026-03-12T18:00:00.000Z",
    "usuario": { "nome": "João" },
    "veiculo": { "nome": "CG Start" }
  }
]
```

---

## 🚀 Próximos Passos

1. **Execute o diagnóstico SQL** (DIAGNOSTICO_MOVIMENTACAO_VEICULOS.sql)
2. **Relate o resultado:**
   - Se houver retiradas no banco → O problema é no frontend
   - Se NÃO houver retiradas → O problema é na criação (POST)
3. **Inspecione o Network do navegador:**
   - Veja o que o endpoint `/api/movimentacao-veiculos` retorna
   - Compare com o que aparece na tela

---

## 📞 Suporte

Se após o diagnóstico ainda houver dúvidas, forneça:
1. Resultado da query SQL (QUERY 1)
2. Resposta do endpoint GET no Postman
3. Screenshot do histórico no frontend

---

**Última atualização:** 12 de março de 2026
