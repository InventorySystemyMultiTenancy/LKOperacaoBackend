# Prompt para Copilot Frontend - Mostrar endereço da loja nas Manutenções

## 🎯 Objetivo

Na tela/aba onde você lista as **manutenções existentes**, exibir também o **endereço da loja** (endereço + cidade/estado) para cada manutenção que tiver `loja` vinculada.

Requisito importante:
- O backend pode retornar manutenção **com `maquina` nula** e **com `loja` preenchida** (isso é esperado e válido).

---

## 📡 Backend - O que já está pronto

### Endpoint principal

```
GET /api/manutencoes
```

> Observação: existe também `GET /api/roteiros/manutencoes` que chama o mesmo handler, mas o recomendado para a tela geral é usar `/api/manutencoes`.

### O que vem no payload

Cada item da lista é uma `Manutencao` com relacionamentos incluídos.

- `loja`: pode ser `null` ou um objeto com:
  - `id`
  - `nome`
  - `endereco`
  - `cidade`
  - `estado`
- `maquina`: pode ser `null` (ex.: manutenção registrada por loja, sem máquina)

### Exemplo de response

```json
[
  {
    "id": "0f0f0f0f-0000-0000-0000-000000000000",
    "descricao": "Trocar coin mech",
    "status": "pendente",
    "createdAt": "2026-03-13T12:34:56.000Z",
    "updatedAt": "2026-03-13T12:34:56.000Z",
    "loja": {
      "id": "11111111-1111-1111-1111-111111111111",
      "nome": "Shopping Exemplo",
      "endereco": "Av. Principal, 123",
      "cidade": "São Paulo",
      "estado": "SP"
    },
    "maquina": null,
    "roteiro": null,
    "funcionario": {
      "id": "22222222-2222-2222-2222-222222222222",
      "nome": "João Técnico"
    }
  }
]
```

---

## ✅ O que preciso que você faça no Frontend

### 1) Buscar as manutenções

Use o mesmo padrão já usado no projeto (axios/fetch). Exemplo com `api` (axios):

```js
const res = await api.get("/manutencoes");
const manutencoes = res.data || [];
```

Se o seu projeto exigir token:

```js
await api.get("/manutencoes", {
  headers: { Authorization: `Bearer ${token}` }
});
```

### 2) Mostrar endereço da loja na listagem

Onde você renderiza cada item (tabela, card, linha), exiba um campo/coluna do tipo:

- **Loja**: `manutencao.loja?.nome`
- **Endereço**: `manutencao.loja?.endereco`
- **Cidade/UF**: `manutencao.loja?.cidade` + "/" + `manutencao.loja?.estado`

### 3) Tratar casos nulos (obrigatório)

- Se `manutencao.loja` for `null`: mostrar `"—"` ou `"Sem loja"`
- Se `loja.endereco` for `null`/vazio: mostrar `"Endereço não cadastrado"`
- Se `cidade`/`estado` não existirem: não mostrar a parte `cidade/UF`

---

## 🧩 Função utilitária (opcional, recomendada)

```js
export function formatarEnderecoLoja(loja) {
  if (!loja) return "—";

  const endereco = (loja.endereco || "").trim();
  const cidade = (loja.cidade || "").trim();
  const estado = (loja.estado || "").trim();

  const cidadeUf = cidade && estado ? `${cidade}/${estado}` : (cidade || estado);

  if (endereco && cidadeUf) return `${endereco} - ${cidadeUf}`;
  if (endereco) return endereco;
  if (cidadeUf) return cidadeUf;

  return "Endereço não cadastrado";
}
```

---

## 🧪 Exemplo de renderização (React)

### Exemplo em tabela

```jsx
<td>{m.loja?.nome || "—"}</td>
<td>{formatarEnderecoLoja(m.loja)}</td>
```

### Exemplo em card

```jsx
<div>
  <div><strong>Loja:</strong> {m.loja?.nome || "—"}</div>
  <div><strong>Endereço:</strong> {formatarEnderecoLoja(m.loja)}</div>
</div>
```

---

## ✅ Critério de aceite

- A listagem de manutenções exibe o endereço quando `loja` existe.
- A UI não quebra quando `loja` ou `endereco` são nulos.
- Manutenções com `maquina: null` continuam aparecendo normalmente.
