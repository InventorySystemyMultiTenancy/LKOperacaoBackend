# Prompt para Copilot Frontend - Alerta em Roteiros Finalizados

## Objetivo

Na tela Selecionar Roteiros, na lista de roteiros com status concluido, mostrar alerta por roteiro quando houver qualquer inconsistência:

- roteiro finalizado com lojas ainda nao concluidas;
- lojas marcadas como concluidas sem nenhuma movimentacao de maquina no roteiro.

O usuario precisa conseguir identificar rapidamente o problema no proprio card/linha do roteiro finalizado.

## Ajuste solicitado para Relatorio (Resumo Geral da Loja)

Na area de relatorio, dentro da secao "Resumo Geral da Loja", a box "🔄 Total de Movimentacoes" deve:

1. Exibir tambem em quais lojas ocorreram as movimentacoes do periodo (ex.: "Loja Centro, Loja Norte").
2. Ser clicavel quando houver movimentacoes.
3. Ao clicar na box, redirecionar para o dashboard ja com filtro da loja em questao para facilitar o clique e visualizacao das movimentacoes.

### Comportamento esperado

- Se existir apenas uma loja com movimentacao:
  - Clicar na box abre o dashboard com essa loja selecionada.
- Se existir mais de uma loja com movimentacao:
  - Mostrar as lojas na propria box.
  - Permitir navegar para o dashboard filtrando por loja (pode abrir a primeira loja por padrao ou oferecer selecao rapida por link/chip dentro da box).
- Se nao houver movimentacao:
  - A box permanece nao clicavel.

### Estrutura de dados recomendada para a box

```json
{
  "totalMovimentacoes": 2,
  "lojasComMovimentacao": [
    { "id": "loja-1", "nome": "Loja Centro" },
    { "id": "loja-2", "nome": "Loja Norte" }
  ]
}
```

### Exemplo de navegacao (React Router)

```jsx
import { useNavigate } from "react-router-dom";

function BoxTotalMovimentacoes({ resumo }) {
  const navigate = useNavigate();
  const total = resumo?.totalMovimentacoes || 0;
  const lojas = resumo?.lojasComMovimentacao || [];

  const irParaDashboard = (lojaId) => {
    if (!lojaId) return;
    navigate(`/dashboard?lojaId=${lojaId}&aba=movimentacoes`);
  };

  return (
    <div
      role={total > 0 ? "button" : undefined}
      tabIndex={total > 0 ? 0 : -1}
      onClick={() => {
        if (total > 0 && lojas[0]?.id) irParaDashboard(lojas[0].id);
      }}
      className={`resumo-card ${total > 0 ? "cursor-pointer" : "opacity-80"}`}
    >
      <p>🔄 {total} Total de Movimentacoes</p>
      <p>
        {lojas.length > 0
          ? `Lojas: ${lojas.map((l) => l.nome).join(", ")}`
          : "Sem movimentacoes no periodo"}
      </p>

      {lojas.length > 1 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {lojas.map((loja) => (
            <button
              key={loja.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                irParaDashboard(loja.id);
              }}
              className="rounded bg-slate-100 px-2 py-1 text-xs"
            >
              Ver {loja.nome}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Contrato de API atualizado

### 1) Listagem principal de roteiros

Endpoint:

```http
GET /api/roteiros?data=YYYY-MM-DD
```

Cada roteiro agora pode vir com o objeto alertaFinalizacao.

Exemplo:

```json
{
  "id": "f2b1...",
  "zona": "Segunda 2",
  "data": "2026-03-18",
  "status": "concluido",
  "lojas": [
    {
      "id": "loja-1",
      "nome": "Loja Centro",
      "concluida": true,
      "ordem": 1,
      "maquinas": []
    }
  ],
  "alertaFinalizacao": {
    "possuiAlertaFinalizacao": true,
    "foiFinalizadoSemConcluirTodasLojas": true,
    "totalLojasNaoConcluidas": 2,
    "lojasNaoConcluidas": [
      {
        "id": "loja-10",
        "nome": "Loja Norte",
        "endereco": "Rua A, 100",
        "cidade": "Sao Paulo",
        "estado": "SP",
        "ordem": 3,
        "concluida": false
      }
    ],
    "totalLojasConcluidasSemMovimentacao": 1,
    "lojasConcluidasSemMovimentacao": [
      {
        "id": "loja-5",
        "nome": "Loja Leste",
        "endereco": "Av B, 90",
        "cidade": "Sao Paulo",
        "estado": "SP",
        "ordem": 2,
        "concluida": true,
        "totalMovimentacoesNoRoteiro": 0
      }
    ]
  }
}
```

Observacao: para roteiros nao concluidos, alertaFinalizacao vem vazio (sem alerta).

### 2) Concluir roteiro

Endpoint:

```http
POST /api/roteiros/:id/concluir
```

Agora o backend permite concluir mesmo com pendencias e devolve alertaFinalizacao no retorno.

Exemplo de resposta:

```json
{
  "message": "Roteiro concluido com alertas",
  "roteiro": {
    "id": "f2b1...",
    "status": "concluido",
    "statusAnterior": "em_andamento",
    "alertaFinalizacao": {
      "possuiAlertaFinalizacao": true,
      "foiFinalizadoSemConcluirTodasLojas": true,
      "totalLojasNaoConcluidas": 2,
      "lojasNaoConcluidas": [],
      "totalLojasConcluidasSemMovimentacao": 1,
      "lojasConcluidasSemMovimentacao": []
    }
  }
}
```

### 3) Endpoint de alertas para ADMIN (opcional na tela)

Endpoint:

```http
GET /api/roteiros/alertas/finalizados-incompletos?data=YYYY-MM-DD
```

Esse endpoint agora retorna os dois tipos de problema e pode ser usado para um painel consolidado no topo da tela (apenas ADMIN).

## Regras de exibicao no frontend

1. Mostrar alerta somente em roteiros com status concluido.
2. Se alertaFinalizacao.possuiAlertaFinalizacao for true, exibir badge de atencao no card/linha.
3. Se foiFinalizadoSemConcluirTodasLojas for true, renderizar lista de lojasNaoConcluidas.
4. Se totalLojasConcluidasSemMovimentacao for maior que zero, renderizar lista de lojasConcluidasSemMovimentacao.
5. Se nao houver alerta, mostrar indicador de finalizacao normal.
6. Em caso de falha na API, nao quebrar a tela; apenas fallback para lista sem alertas.

## Fluxo recomendado (React)

```js
const [roteiros, setRoteiros] = useState([]);
const [loading, setLoading] = useState(false);

async function carregarRoteiros(dataSelecionada) {
  try {
    setLoading(true);
    const params = dataSelecionada ? { data: dataSelecionada } : {};
    const res = await api.get("/roteiros", { params });
    setRoteiros(Array.isArray(res.data) ? res.data : []);
  } catch (error) {
    console.error("Erro ao carregar roteiros:", error);
    setRoteiros([]);
  } finally {
    setLoading(false);
  }
}

function getAlertaFinalizacao(roteiro) {
  return (
    roteiro?.alertaFinalizacao || {
      possuiAlertaFinalizacao: false,
      foiFinalizadoSemConcluirTodasLojas: false,
      totalLojasNaoConcluidas: 0,
      lojasNaoConcluidas: [],
      totalLojasConcluidasSemMovimentacao: 0,
      lojasConcluidasSemMovimentacao: [],
    }
  );
}
```

## Exemplo de renderizacao no card de roteiro concluido

```jsx
function CardRoteiroConcluido({ roteiro }) {
  const alerta = getAlertaFinalizacao(roteiro);

  return (
    <div className="rounded-lg border p-3 bg-white">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">{roteiro.zona}</h4>
        {alerta.possuiAlertaFinalizacao ? (
          <span className="rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
            Finalizado com alerta
          </span>
        ) : (
          <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">
            Finalizado sem pendencias
          </span>
        )}
      </div>

      {alerta.foiFinalizadoSemConcluirTodasLojas && (
        <section className="mt-3">
          <p className="text-sm font-medium text-red-700">
            Lojas nao concluidas ({alerta.totalLojasNaoConcluidas})
          </p>
          <ul className="mt-1 list-disc pl-5 text-sm text-red-900">
            {alerta.lojasNaoConcluidas.map((loja) => (
              <li key={loja.id}>{loja.nome || "Loja sem nome"}</li>
            ))}
          </ul>
        </section>
      )}

      {alerta.totalLojasConcluidasSemMovimentacao > 0 && (
        <section className="mt-3">
          <p className="text-sm font-medium text-orange-700">
            Lojas concluidas sem movimentacao ({alerta.totalLojasConcluidasSemMovimentacao})
          </p>
          <ul className="mt-1 list-disc pl-5 text-sm text-orange-900">
            {alerta.lojasConcluidasSemMovimentacao.map((loja) => (
              <li key={loja.id}>{loja.nome || "Loja sem nome"}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
```

## Criterios de aceite

1. Roteiros concluidos exibem status visual correto de alerta ou sem alerta.
2. Quando houver problema, o card mostra as lojas nao concluidas.
3. Quando houver problema, o card mostra as lojas concluidas sem movimentacao.
4. O frontend continua funcionando mesmo se o backend retornar erro.
5. A informacao aparece na propria area de Selecionar Roteiros, sem precisar abrir outra tela.
