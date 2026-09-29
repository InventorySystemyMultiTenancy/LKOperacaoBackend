# Prompt para Copilot Frontend - Integração Machine Pay (Cyberpix)

## 🎯 Objetivo

O backend agora integra com o painel **Machine Pay (Cyberpix)** — os leitores PIX/cartão instalados nas máquinas. O valor de pagamento digital (cartão/PIX) das máquinas configuradas **é buscado e preenchido automaticamente pelo backend**, então o formulário de coleta não deve mais exigir que o usuário digite esse valor manualmente para essas máquinas.

Preciso que você:
1. Adicione os campos `machinePayPosId`/`machinePayUsrId` no cadastro/edição de máquina.
2. Ajuste o fluxo de **registrar coleta** para lidar com a busca automática (incluindo o caso em que é preciso perguntar ao usuário "desde quando contar" na primeira coleta).
3. Ajuste a tela de **conferência financeira** (pendentes) para mostrar o valor pré-preenchido, oferecer um botão de "buscar novamente" e exibir o resultado do fechamento de caixa.
4. (Opcional, mas recomendado) Adicione uma pequena área de ações Machine Pay na tela de detalhes da máquina (status online/offline, extrato, crédito manual, devolução) — apenas para ADMIN/FINANCEIRO.

Esta é uma integração **best-effort**: toda chamada à Machine Pay pode falhar (painel fora do ar, sessão, etc.) sem que isso trave o fluxo principal do usuário. Trate todo retorno relacionado a Machine Pay como informativo/não-bloqueante, exceto onde eu disser explicitamente o contrário.

---

## 📡 Backend - O que já está pronto

### 1) Cadastro/edição de máquina

```
POST /api/maquinas      (ADMIN)
PUT  /api/maquinas/:id  (ADMIN)
```

O body aceita, além dos campos já existentes, dois novos campos **opcionais**:

```json
{
  "machinePayPosId": "12345",
  "machinePayUsrId": "67"
}
```

- `machinePayPosId`: **string**, o ID do POS (leitor físico) cadastrado no painel Machine Pay. É digitado manualmente pelo usuário — não tem descoberta automática (é um dado físico do equipamento). **Deve ser único entre as máquinas.**
- `machinePayUsrId`: **string**, opcional. Só é relevante para a feature de status online/offline. O backend tenta descobrir esse valor sozinho quando `machinePayPosId` é preenchido e `machinePayUsrId` fica vazio — **normalmente você não precisa expor este campo no formulário principal**, só como campo avançado/opcional caso o admin queira sobrescrever.

Erro possível ao salvar (400):
```json
{ "error": "Este posId da Machine Pay já está em uso por outra máquina" }
```
Trate isso como erro de validação de formulário (mostrar a mensagem perto do campo `machinePayPosId`).

A resposta da máquina (GET/POST/PUT) agora inclui `machinePayPosId` e `machinePayUsrId` junto dos demais campos.

---

### 2) Endpoint de estoque da máquina — novo flag

```
GET /api/maquinas/:id/estoque
```

Resposta agora inclui dois campos novos:

```json
{
  "maquina": { "id": "...", "codigo": "M01", "nome": "...", "capacidadePadrao": 100 },
  "estoqueAtual": 80,
  "percentualEstoque": "80.00",
  "estoqueMinimo": 30,
  "alertaEstoqueBaixo": false,
  "ultimaAtualizacao": "2026-07-01T12:00:00.000Z",
  "machinePayPosId": "12345",
  "machinePayPrecisaDataInicio": true
}
```

- `machinePayPosId`: `null` se a máquina não tiver Machine Pay configurada.
- `machinePayPrecisaDataInicio`: **`true`** apenas quando a máquina tem `machinePayPosId` configurado **e** é a primeira coleta dela (não existe movimentação anterior). Nesse caso o backend não tem como saber desde quando contar o valor digital — **é obrigatório perguntar ao usuário** antes de registrar a coleta (ver seção 3 abaixo).

Este endpoint já é chamado hoje na tela de coleta (para mostrar o estoque atual) — só use os dois campos novos que já vêm junto.

---

### 3) Registrar coleta (Movimentação)

```
POST /api/movimentacoes
```

**Campo novo e opcional no body**: `machinePayDataInicio` (string de data, ex: `"2026-07-01"` ou ISO completo). Só precisa ser enviado quando `machinePayPrecisaDataInicio` (do endpoint de estoque, seção 2) for `true`.

O campo `valorEntradaCartao` (valor de pagamento digital cartão/PIX) continua existindo no body, mas **para máquinas com `machinePayPosId` configurado ele é ignorado/sobrescrito** pelo valor buscado automaticamente na Machine Pay — não precisa mais ser preenchido pelo usuário para essas máquinas.

**A resposta (201) agora inclui um campo extra `machinePay`** com o resultado da busca automática:

```jsonc
// Caso 1: máquina sem Machine Pay configurada
{ "id": "...", /* ...demais campos da movimentação... */, "machinePay": null }

// Caso 2: busca deu certo
{
  "id": "...",
  "valorEntradaCartao": 1008.00,
  /* ...demais campos... */,
  "machinePay": {
    "sucesso": true,
    "pix": 156,
    "debito": 401,
    "credito": 451,
    "cartao": 852,
    "brutoComTaxasMp": 1008,
    "cartaoPix": 1008,
    "taxas": 10.27,
    "liquido": 997.73,
    "percentualTaxaMedia": 1.0188
  }
}

// Caso 3: busca falhou (painel fora do ar, etc.) — a movimentação foi criada normalmente
{ "id": "...", /* ... */, "machinePay": { "sucesso": false, "erro": "mensagem do erro" } }

// Caso 4: primeira coleta da máquina e você esqueceu de enviar machinePayDataInicio
{ "id": "...", /* ... */, "machinePay": { "sucesso": false, "precisaDataInicio": true } }
```

> Importante: mesmo nos casos 3 e 4 a movimentação **é criada normalmente** (a integração nunca bloqueia o registro). O campo `machinePay` é só para você decidir se mostra um aviso ao usuário.

---

### 4) Conferência financeira (pendentes)

Endpoints já existentes, sem mudança de contrato:

```
GET /api/movimentacoes/pendentes-financeiro
PUT /api/movimentacoes/:id/financeiro
```

O que muda: quando a movimentação pertence a uma máquina com Machine Pay configurada, o campo `valorEntradaCartao` **já deve vir pré-preenchido** (foi calculado no passo 3, na criação da movimentação) — a pessoa só confirma ou ajusta manualmente se quiser.

A resposta de `PUT /:id/financeiro` agora inclui um campo extra `machinePayFechamento`:

```jsonc
{
  "message": "Valores financeiros atualizados com sucesso",
  "movimentacao": { /* ... */ },
  "machinePayFechamento": null // ou:
  // { "sucesso": true }
  // { "sucesso": false, "motivo": "Nenhuma movimentação anterior encontrada para determinar o período de fechamento" }
  // { "sucesso": false, "erro": "mensagem do erro" }
}
```

Isso indica se o backend conseguiu "fechar o caixa" da máquina no painel Machine Pay (zerar o período). É só informativo — a confirmação financeira local **já foi salva com sucesso** independente desse resultado.

**Endpoint novo** — botão de "buscar/refazer busca" do valor digital:

```
POST /api/movimentacoes/:id/machine-pay/buscar
```
- Papel exigido: `ADMIN` ou `FINANCEIRO`.
- Body (opcional): `{ "dataInicio": "2026-07-01" }`
- Sem body: o backend recalcula usando a movimentação anterior da mesma máquina automaticamente.

Resposta de sucesso (200):
```json
{
  "movimentacao": { "...": "já atualizada com o novo valorEntradaCartao" },
  "fechamento": {
    "pix": 156, "debito": 401, "credito": 451, "cartao": 852,
    "brutoComTaxasMp": 1008, "cartaoPix": 1008,
    "taxas": 10.27, "liquido": 997.73, "percentualTaxaMedia": 1.0188
  }
}
```

Resposta quando não dá pra determinar o período (400) — **este caso deve ser tratado explicitamente na UI**, pedindo a data ao usuário e reenviando com `dataInicio`:
```json
{
  "error": "Não foi possível determinar a data inicial do período. Informe dataInicio.",
  "machinePayPrecisaDataInicio": true
}
```

Outros erros (400/502) vêm como `{ "error": "mensagem" }`, e devem ser mostrados como erro explícito (este endpoint é uma ação explícita do usuário — clicou no botão "buscar novamente" —, então, ao contrário da criação automática, **aqui o erro deve aparecer visivelmente**, não silenciosamente).

---

### 5) Ações administrativas por máquina (opcional nesta entrega)

Grupo de rotas novo, todas exigindo `machinePayPosId` configurado na máquina:

```
GET  /api/machine-pay/maquinas/:id/status                        (ADMIN, FINANCEIRO)
GET  /api/machine-pay/maquinas/:id/extrato?dataInicio=&dataFim=  (ADMIN, FINANCEIRO)
POST /api/machine-pay/maquinas/:id/credito     { creditos }       (ADMIN)
POST /api/machine-pay/maquinas/:id/devolucao   { idwebhook }      (ADMIN)
```

- `GET .../status` → `{ "online": true }` (exige também `machinePayUsrId` configurado; se não tiver, retorna 400 com mensagem explicando).
- `GET .../extrato` → mesmo formato do objeto `fechamento` mostrado acima (`pix`, `debito`, `credito`, `cartao`, `brutoComTaxasMp`, `cartaoPix`, `taxas`, `liquido`, `percentualTaxaMedia`). `dataInicio`/`dataFim` no formato `YYYY-MM-DD`.
- `POST .../credito` → credita saldo manualmente na máquina. Body: `{ "creditos": 10 }` (número > 0). Resposta: `{ "respostaBruta": "..." }` (texto cru do painel — não há confirmação estruturada, só sucesso/erro HTTP).
- `POST .../devolucao` → solicita estorno de uma transação. Body: `{ "idwebhook": "abc123" }`. Resposta: `{ "respostaBruta": "..." }`.

---

## ✅ O que preciso que você faça no Frontend

### 1) Formulário de Cadastro/Edição de Máquina

Adicionar dois campos novos, de preferência numa seção "Integração Machine Pay" (pode ser colapsável/opcional, já que a maioria das máquinas pode não ter):

```jsx
<fieldset>
  <legend>Integração Machine Pay (opcional)</legend>

  <label>
    Pos ID (leitor PIX/cartão)
    <input
      type="text"
      value={form.machinePayPosId || ""}
      onChange={(e) => setForm({ ...form, machinePayPosId: e.target.value })}
      placeholder="Ex: 123456"
    />
    <small>ID do leitor cadastrado no painel Machine Pay. Deixe em branco se esta máquina não tiver leitor digital.</small>
  </label>

  {/* Campo avançado — normalmente não precisa ser preenchido manualmente */}
  <details>
    <summary>Avançado</summary>
    <label>
      Usr ID (Machine Pay)
      <input
        type="text"
        value={form.machinePayUsrId || ""}
        onChange={(e) => setForm({ ...form, machinePayUsrId: e.target.value })}
      />
      <small>Normalmente descoberto automaticamente. Só preencha se souber o que está fazendo.</small>
    </label>
  </details>
</fieldset>
```

No `handleSubmit`, envie `machinePayPosId`/`machinePayUsrId` junto do resto do body (envie `null`/omita se vazio, não string vazia).

Trate o erro 400 de posId duplicado mostrando a mensagem retornada (`error`) como erro de campo em `machinePayPosId`:
```js
try {
  await api.post("/maquinas", payload);
} catch (err) {
  if (err.response?.status === 400 && err.response.data?.error?.includes("posId")) {
    setErrosCampo({ machinePayPosId: err.response.data.error });
    return;
  }
  // ...tratamento genérico de erro
}
```

---

### 2) Tela de Registrar Coleta (Movimentação)

**Passo a: ao carregar a tela**, quando o usuário seleciona a máquina, você já chama (ou deve passar a chamar) `GET /api/maquinas/:id/estoque`. Guarde `machinePayPosId` e `machinePayPrecisaDataInicio` da resposta em estado.

**Passo b: se `machinePayPrecisaDataInicio === true`**, antes de permitir o envio do formulário, exiba um campo de data obrigatório perguntando desde quando considerar os valores digitais:

```jsx
{estoque?.machinePayPrecisaDataInicio && (
  <label>
    Desde quando devemos considerar os valores digitais (PIX/cartão) desta máquina?
    <input
      type="date"
      value={machinePayDataInicio}
      onChange={(e) => setMachinePayDataInicio(e.target.value)}
      required
    />
    <small>
      Esta é a primeira coleta desta máquina com leitor Machine Pay configurado —
      precisamos saber a partir de qual data contar o faturamento digital.
    </small>
  </label>
)}
```

Ao montar o body de `POST /api/movimentacoes`, inclua `machinePayDataInicio: machinePayDataInicio` apenas quando esse campo estiver visível/preenchido.

**Passo c: esconda (ou torne somente-leitura) o campo manual de "valor de pagamento digital cartão/PIX"** quando `estoque?.machinePayPosId` estiver presente — esse valor passa a ser preenchido pelo backend. Se quiser manter visível por transparência, deixe-o desabilitado com um texto tipo "Preenchido automaticamente pela Machine Pay após salvar".

**Passo d: após criar a movimentação**, use o campo `machinePay` da resposta para dar feedback não-bloqueante:

```js
const resposta = await api.post("/movimentacoes", payload);
const { machinePay } = resposta.data;

if (machinePay?.sucesso === true) {
  toast.success(`Valor digital buscado automaticamente: R$ ${machinePay.cartaoPix.toFixed(2)}`);
} else if (machinePay?.sucesso === false && machinePay.precisaDataInicio) {
  toast.warning("Não foi possível buscar o valor digital: faltou informar a data inicial. Você pode preencher manualmente na conferência financeira.");
} else if (machinePay?.sucesso === false) {
  toast.warning(`Não foi possível buscar o valor digital automaticamente (${machinePay.erro}). Você pode preencher manualmente na conferência financeira.`);
}
// machinePay === null: máquina sem Machine Pay, não mostrar nada
```

Nunca bloqueie a navegação/sucesso do formulário por causa desse resultado — a movimentação já foi criada com sucesso independente do `machinePay`.

---

### 3) Tela de Conferência Financeira (Pendentes)

Na tela que lista `GET /api/movimentacoes/pendentes-financeiro` e permite confirmar com `PUT /:id/financeiro`:

**Passo a**: o campo "valor digital (cartão/PIX)" já deve carregar pré-preenchido com `movimentacao.valorEntradaCartao` (isso já deveria ser o comportamento atual do formulário — só confirme que não está sendo zerado/ignorado).

**Passo b**: adicione um botão "🔄 Buscar novamente" ao lado desse campo:

```jsx
async function buscarNovamenteValorDigital(movimentacaoId, dataInicio = undefined) {
  try {
    const resposta = await api.post(`/movimentacoes/${movimentacaoId}/machine-pay/buscar`, dataInicio ? { dataInicio } : {});
    const { fechamento } = resposta.data;
    setValorEntradaCartao(fechamento.cartaoPix);
    toast.success(`Valor atualizado: R$ ${fechamento.cartaoPix.toFixed(2)}`);
  } catch (err) {
    const data = err.response?.data;
    if (err.response?.status === 400 && data?.machinePayPrecisaDataInicio) {
      // Pedir a data ao usuário (abrir um modal/prompt de data) e chamar de novo:
      // buscarNovamenteValorDigital(movimentacaoId, dataEscolhidaPeloUsuario)
      abrirModalPedirDataInicio(movimentacaoId);
      return;
    }
    // Aqui o erro deve aparecer de forma visível — é uma ação explícita do usuário
    toast.error(data?.error || "Erro ao buscar valor digital na Machine Pay");
  }
}
```

Esse botão só deve aparecer quando a movimentação pertence a uma máquina com `machinePayPosId` configurado — o backend já expõe isso diretamente em cada item de `GET /movimentacoes/pendentes-financeiro` (campos `machinePayPosId` e `machinePayPrecisaDataInicio` no nível raiz do item). **Ver detalhamento completo desse fluxo, incluindo o caso de primeira coleta sem período conhecido, em `PROMPT_FRONTEND_MACHINE_PAY_DATA_INICIO.md`.**

**Passo c**: depois de confirmar (`PUT /:id/financeiro`), leia `machinePayFechamento` da resposta e mostre um aviso não-bloqueante:

```js
const resposta = await api.put(`/movimentacoes/${id}/financeiro`, payload);
const { machinePayFechamento } = resposta.data;

if (machinePayFechamento?.sucesso === true) {
  toast.success("Caixa fechado na Machine Pay.");
} else if (machinePayFechamento?.sucesso === false) {
  toast.warning(`Confirmação salva, mas não foi possível fechar o caixa na Machine Pay (${machinePayFechamento.erro || machinePayFechamento.motivo}).`);
}
```
A confirmação financeira local já foi salva com sucesso nesse ponto — este toast é só informativo.

---

### 4) (Opcional) Ações Machine Pay na tela de detalhes da máquina

Se a tela de detalhes/edição de máquina tiver espaço, adicione uma seção "Machine Pay" visível **apenas quando `machinePayPosId` estiver preenchido**:

- Um indicador de status: chama `GET /api/machine-pay/maquinas/:id/status` e mostra "🟢 Online" / "🔴 Offline" (ou "—" se der erro/não configurado).
- Um botão "Ver extrato" que abre um seletor de período e chama `GET /api/machine-pay/maquinas/:id/extrato?dataInicio=&dataFim=`, mostrando os campos `pix`, `debito`, `credito`, `taxas`, `liquido` numa tabelinha.
- (Só ADMIN) Botão "Creditar saldo manual" → modal com campo numérico `creditos`, chama `POST .../credito`.
- (Só ADMIN) Botão "Solicitar devolução" → modal com campo `idwebhook`, chama `POST .../devolucao`.

Essas chamadas podem demorar alguns segundos (a Machine Pay faz login a cada operação) — use spinner/loading state.

---

## 🔒 Permissões

Use o mesmo mecanismo de RBAC que o projeto já usa para esconder/desabilitar:
- Botão "buscar novamente" (conferência financeira) e seção de status/extrato: visível para `ADMIN` e `FINANCEIRO`.
- Botões "Creditar saldo manual" e "Solicitar devolução": visíveis **apenas** para `ADMIN`.
- Campos `machinePayPosId`/`machinePayUsrId` no formulário de máquina: seguem a mesma regra de acesso que os demais campos do formulário (hoje é `ADMIN`).

---

## ⚠️ Tratamento de erros e estados

- Todas as chamadas relacionadas à Machine Pay podem ser lentas (1 a 3s, pois fazem login no painel a cada chamada) — sempre mostre loading, nunca deixe o botão parecer travado sem feedback.
- Falhas em **busca automática na criação da coleta** e no **fechamento de caixa pós-confirmação**: tratamento **não-bloqueante** (toast de aviso, o fluxo principal já foi concluído com sucesso).
- Falha no botão explícito **"buscar novamente"**: tratamento **visível/bloqueante daquela ação específica** (o usuário pediu aquilo explicitamente, ele precisa saber que não funcionou).
- Erro de posId duplicado ao salvar máquina: erro de validação de formulário, não deixa salvar.

---

## ✅ Critério de aceite

- [ ] Formulário de máquina tem os campos `machinePayPosId` (visível) e `machinePayUsrId` (avançado/opcional).
- [ ] Erro de posId duplicado aparece como erro de campo, formulário não é submetido.
- [ ] Ao registrar coleta de uma máquina com Machine Pay configurada e **sem** movimentação anterior, o formulário pede a data inicial antes de permitir enviar.
- [ ] O campo manual de valor digital não é mais exigido do usuário para máquinas com Machine Pay configurada.
- [ ] Após criar a coleta, o usuário recebe um feedback não-bloqueante sobre o resultado da busca automática (sucesso, falha, ou "faltou a data").
- [ ] Na conferência financeira, o valor digital vem pré-preenchido quando disponível.
- [ ] Existe um botão "buscar novamente" na conferência financeira que chama `POST /movimentacoes/:id/machine-pay/buscar`, trata o caso `machinePayPrecisaDataInicio` pedindo a data, e mostra erro visível em caso de falha.
- [ ] Após confirmar os valores financeiros, o usuário vê um aviso (não-bloqueante) sobre o fechamento de caixa na Machine Pay.
- [ ] Nenhuma dessas integrações trava o fluxo principal (registrar coleta / confirmar financeiro) em caso de falha da Machine Pay.
