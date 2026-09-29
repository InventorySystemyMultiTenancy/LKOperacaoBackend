# Prompt para Copilot Frontend - Data inicial editável no "Buscar novamente" (Machine Pay)

## 🎯 Objetivo

Na tela de **Conferência Financeira** (pendentes), quando uma pendência é a **primeira coleta** de uma máquina com Machine Pay configurada, não existe movimentação anterior pra saber desde quando contar o valor digital (cartão/PIX). Nesse caso, o botão **"🔄 Buscar novamente"** sozinho não é suficiente — precisa aparecer, ao lado dele, um **campo de data editável** para o usuário informar manualmente o início do período antes de buscar.

Isso já existia parcialmente (o endpoint de busca já aceitava uma data manual), mas agora o backend também informa **antecipadamente**, já na listagem, quais pendências precisam desse campo — então dá pra mostrar o campo de cara, sem esperar o usuário clicar e tomar um erro primeiro.

---

## 📡 Backend - O que já está pronto

### `GET /api/movimentacoes/pendentes-financeiro`

Cada item da lista agora inclui dois campos novos:

```jsonc
{
  "id": "55ac3f7e-7b7e-467d-910d-0775d809dc3e",
  "dataColeta": "2026-07-13T15:44:00.000Z",
  "maquina": { "id": "...", "codigo": "M01", "nome": "...", "machinePayPosId": "130569187", "loja": { "...": "..." } },
  "usuario": { "...": "..." },
  "valorEntradaCartao": null,
  "statusFinanceiro": "pendente",
  // ...demais campos já existentes...

  "machinePayPosId": "130569187", // null se a máquina não tem Machine Pay configurada
  "machinePayPrecisaDataInicio": true // true = é a primeira coleta dessa máquina, não dá pra buscar sem informar a data
}
```

- `machinePayPosId`: repetido no nível raiz do item (além de dentro de `maquina`) só por conveniência de leitura.
- `machinePayPrecisaDataInicio`:
  - `false` quando a máquina não tem Machine Pay configurada, **ou** quando já existe uma movimentação anterior dessa máquina (o backend consegue calcular o período sozinho).
  - **`true`** quando a máquina tem `machinePayPosId` configurado **e** esta é a primeira coleta dela (sem movimentação anterior) — é obrigatório mostrar o campo de data nesse caso.

### `POST /api/movimentacoes/:id/machine-pay/buscar`

Sem mudança de contrato (já aceitava isso antes), só reforçando:

- Body opcional: `{ "dataInicio": "2026-07-01" }` (aceita `YYYY-MM-DD` ou data ISO completa).
- **Se `machinePayPrecisaDataInicio` for `true` para essa pendência, `dataInicio` é obrigatório** — sem ele, a resposta é 400:
  ```json
  {
    "error": "Não foi possível determinar a data inicial do período. Informe dataInicio.",
    "machinePayPrecisaDataInicio": true
  }
  ```
- Se `dataInicio` for enviado mesmo quando não é obrigatório (pendência com movimentação anterior), ele **sobrescreve** o cálculo automático — ou seja, o usuário pode usar o campo pra forçar um período diferente do padrão, não só nos casos obrigatórios.
- Resposta de sucesso (200): `{ "movimentacao": {...}, "fechamento": { "pix": ..., "debito": ..., "credito": ..., "cartao": ..., "brutoComTaxasMp": ..., "cartaoPix": ..., "taxas": ..., "liquido": ..., "percentualTaxaMedia": ... } }`.

---

## ✅ O que preciso que você faça no Frontend

Na tela de Conferência Financeira, ao lado do botão "🔄 Buscar novamente" de cada pendência:

### 1) Sempre mostrar o campo de data quando `machinePayPrecisaDataInicio === true`

```jsx
function LinhaPendenciaFinanceira({ pendencia }) {
  const [dataInicio, setDataInicio] = useState("");
  const [carregando, setCarregando] = useState(false);

  const precisaDataInicio = pendencia.machinePayPrecisaDataInicio === true;
  const temMachinePay = Boolean(pendencia.machinePayPosId);

  async function buscarValorDigital() {
    if (precisaDataInicio && !dataInicio) {
      toast.warning("Informe a data inicial antes de buscar.");
      return;
    }

    setCarregando(true);
    try {
      const resposta = await api.post(
        `/movimentacoes/${pendencia.id}/machine-pay/buscar`,
        dataInicio ? { dataInicio } : {},
      );
      const { fechamento } = resposta.data;
      atualizarValorEntradaCartao(pendencia.id, fechamento.cartaoPix);
      toast.success(`Valor atualizado: R$ ${fechamento.cartaoPix.toFixed(2)}`);
    } catch (err) {
      const data = err.response?.data;
      if (err.response?.status === 400 && data?.machinePayPrecisaDataInicio) {
        toast.warning("Informe a data inicial antes de buscar.");
        return;
      }
      toast.error(data?.error || "Erro ao buscar valor digital na Machine Pay");
    } finally {
      setCarregando(false);
    }
  }

  if (!temMachinePay) return null; // sem Machine Pay configurada, nem mostra a seção

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      {precisaDataInicio && (
        <label style={{ display: "flex", flexDirection: "column", fontSize: "12px" }}>
          Desde quando considerar os valores digitais?
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            required
          />
        </label>
      )}

      <button
        onClick={buscarValorDigital}
        disabled={carregando || (precisaDataInicio && !dataInicio)}
      >
        {carregando ? "Buscando..." : "🔄 Buscar novamente"}
      </button>
    </div>
  );
}
```

### 2) Texto de apoio quando o campo aparece

Como é a primeira coleta da máquina, deixe claro pro usuário por que está pedindo isso:

```jsx
{precisaDataInicio && (
  <small style={{ color: "#666" }}>
    Esta é a primeira coleta desta máquina com leitor Machine Pay configurado —
    informe a partir de qual data devemos considerar o faturamento digital (PIX/cartão).
  </small>
)}
```

### 3) Botão desabilitado até a data ser preenchida (quando obrigatória)

Já coberto no exemplo acima via `disabled={carregando || (precisaDataInicio && !dataInicio)}` — não deixe o usuário clicar em "Buscar novamente" sem a data quando ela é obrigatória, pra não gerar uma chamada que sabidamente vai falhar com 400.

### 4) Fora do caso obrigatório, o campo pode ficar escondido/opcional

Quando `machinePayPrecisaDataInicio === false` mas a máquina tem Machine Pay (`machinePayPosId` presente), o campo de data não é obrigatório — o botão sozinho já funciona (o backend calcula usando a movimentação anterior). Se quiser, pode expor o campo de data ali também como **opcional avançado** ("forçar outro período"), mas isso não é obrigatório nesta entrega.

---

## ✅ Critério de aceite

- [ ] Pendências cuja máquina não tem Machine Pay configurada (`machinePayPosId === null`) não mostram nada relacionado a Machine Pay.
- [ ] Pendências com `machinePayPrecisaDataInicio === true` mostram o campo de data **sempre visível** (não só depois de um erro).
- [ ] O botão "Buscar novamente" fica desabilitado enquanto a data obrigatória não for preenchida.
- [ ] Ao buscar com sucesso, o campo de valor digital é atualizado com `fechamento.cartaoPix` e o usuário recebe confirmação.
- [ ] Se mesmo assim vier 400 com `machinePayPrecisaDataInicio: true` (ex: race condition, campo ficou vazio por algum motivo), mostrar aviso pedindo a data — não deixar erro genérico sem explicação.
