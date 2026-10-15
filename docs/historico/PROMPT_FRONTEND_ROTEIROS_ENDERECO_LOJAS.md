# Prompt para Copilot Frontend - Endereço ao lado do nome da loja (Executar Roteiro)

## 🎯 Objetivo

Na tela de **Executar Roteiro**, onde você lista as **lojas do roteiro**, exibir o **endereço da loja** ao lado (ou logo abaixo) do **nome**.

Regra:
- Não fazer request extra para buscar endereço: o backend já devolve `endereco/cidade/estado` junto das lojas do roteiro.

---

## 📡 Backend — o que já está pronto

Você pode obter as lojas do roteiro por qualquer um dos endpoints abaixo (use o que o seu frontend já usa hoje):

### Opção A (mais comum): Detalhe do roteiro

```
GET /api/roteiros/:id
```

Response contém `lojas: [...]` e cada loja já vem com:
- `nome`
- `endereco`
- `cidade`
- `estado`

Além disso, na tela de executar roteiro normalmente você já usa também:
- `concluida`, `ordem`
- `maquinas: [...]`

### Opção B: Lojas do roteiro

```
GET /api/roteiros/:roteiroId/lojas
```

Response é um array de lojas já com `endereco/cidade/estado`.

---

## ✅ Como mostrar o endereço no Frontend

### 1) Exemplo de como ler os campos

Para cada item `loja` dentro do roteiro:

- Nome: `loja.nome`
- Endereço (rua/número): `loja.endereco`
- Cidade/UF: `loja.cidade` + "/" + `loja.estado`

### 2) Tratar nulos (obrigatório)

- Se `loja.endereco` vier `null`/vazio: mostrar `"Endereço não cadastrado"`
- Se `cidade`/`estado` faltarem: não montar `cidade/UF` quebrado

---

## 🧩 Função utilitária recomendada

```js
export function formatarEnderecoLoja(loja) {
  if (!loja) return "";

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

## 🧪 Exemplos de renderização (React)

### A) “Ao lado do nome” (mesma linha)

```jsx
<div>
  <span className="font-semibold">{loja.nome}</span>
  <span className="text-sm opacity-70">{" "}— {formatarEnderecoLoja(loja)}</span>
</div>
```

### B) Nome em cima, endereço embaixo (mais legível)

```jsx
<div>
  <div className="font-semibold">{loja.nome}</div>
  <div className="text-sm opacity-70">{formatarEnderecoLoja(loja)}</div>
</div>
```

---

## ✅ Critério de aceite

- No Executar Roteiro, cada loja mostra nome + endereço.
- A UI não quebra quando `endereco/cidade/estado` vierem nulos.
- Nenhuma chamada adicional para `/api/lojas` é necessária.
