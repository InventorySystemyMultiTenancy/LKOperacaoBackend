# Sistema de Comissões - Documentação

## Resumo
Foi implementado um sistema completo de comissões que permite:
1. Configurar uma porcentagem de comissão para cada máquina
2. Calcular automaticamente as comissões sobre o lucro quando uma loja é finalizada no roteiro
3. Armazenar histórico de comissões por loja
4. Visualizar e imprimir relatórios de comissões no Dashboard

## Alterações Realizadas

### 1. Modelo de Dados (Backend)

#### Arquivo: `src/models/Maquina.js`
- **Adicionado campo**: `percentualComissao` (DECIMAL 5,2)
  - Valores de 0 a 100%
  - Padrão: 0
  - Armazena a porcentagem de comissão sobre o lucro da máquina

#### Arquivo: `src/models/ComissaoLoja.js` (NOVO)
- Novo modelo para armazenar comissões calculadas
- **Campos**:
  - `lojaId`: Referência à loja
  - `roteiroId`: Referência ao roteiro (opcional)
  - `dataCalculo`: Data do cálculo
  - `totalLucro`: Lucro total calculado
  - `totalComissao`: Comissão total calculada
  - `detalhes`: JSON com detalhes por máquina

#### Arquivo: `src/models/index.js`
- Adicionado relacionamento entre ComissaoLoja, Loja e Roteiro

### 2. Migration

#### Arquivo: `src/database/migrations/add-comissao-maquinas-lojas.js` (NOVO)
- Adiciona coluna `percentual_comissao` na tabela `maquinas`
- Cria tabela `comissoes_lojas` com todos os campos necessários

**Para executar a migration:**
```javascript
import { up } from './src/database/migrations/add-comissao-maquinas-lojas.js';
await up();
```

### 3. Controllers

#### Arquivo: `src/controllers/maquinaController.js`
- **Função `criarMaquina`**: Aceita e salva `percentualComissao`
- **Função `atualizarMaquina`**: Atualiza `percentualComissao`

#### Arquivo: `src/controllers/roteiroController.js`
- **Função `concluirLoja`**: Modificada para chamar `calcularComissaoLoja()` quando uma loja é concluída
- **Função `calcularComissaoLoja()`** (NOVA):
  - Busca máquinas da loja com comissão configurada
  - Para cada máquina:
    - Calcula receita total (fichas + notas + cartão)
    - Calcula custo dos produtos que saíram
    - Calcula lucro = receita - custo
    - Aplica percentual de comissão sobre o lucro
  - Salva registro em `ComissaoLoja`

#### Arquivo: `src/controllers/relatorioController.js`
- **Função `relatorioComissoes()`** (NOVA):
  - Endpoint: `GET /api/relatorios/comissoes`
  - Parâmetros opcionais: `dataInicio`, `dataFim`, `lojaId`
  - Retorna:
    - Total geral de lucro e comissão
    - Comissões agrupadas por loja
    - Lista detalhada de todas as comissões

### 4. Rotas

#### Arquivo: `src/routes/relatorio.routes.js`
- Adicionada rota: `GET /relatorios/comissoes` (restrita a ADMIN)

### 5. Frontend

#### Arquivo: `frontend/MaquinaForm.jsx`
- Adicionado campo de input "Percentual de Comissão (%)"
- Campo aceita valores de 0 a 100 com duas casas decimais
- Incluído no estado `formData`
- Enviado ao criar/atualizar máquina

#### Arquivo: `frontend/Dashboard.jsx`
- **Novo botão**: "💰 Relatório de Comissões" (visível apenas para ADMIN)
- **Novo modal**: Exibe relatório completo de comissões com:
  - Resumo geral (total de lucro e comissões)
  - Tabela de comissões por loja
  - Detalhamento por data
  - Botão para imprimir relatório
- **Função `carregarRelatorioComissoes()`**: Busca dados da API
- **Função `imprimirRelatorioComissoes()`**: Gera versão para impressão

## Como Funciona

### Fluxo de Cálculo de Comissão

1. **Configuração**: Ao criar/editar uma máquina, o administrador define um percentual de comissão (ex: 10%)

2. **Execução do Roteiro**: Durante a execução do roteiro, as movimentações são registradas normalmente com:
   - Valores de entrada (fichas, notas, cartão)
   - Produtos que saíram
   - Produtos abastecidos

3. **Finalização da Loja**: Quando uma loja é marcada como concluída no roteiro:
   - Sistema busca todas as máquinas da loja com comissão > 0
   - Para cada máquina:
     - Calcula receita = valorEntradaFichas + valorEntradaNotas + valorEntradaCartao
     - Calcula custo = soma(precoCompra × quantidadeSaiu) de todos os produtos
     - Calcula lucro = receita - custo
     - Calcula comissão = lucro × (percentualComissao / 100)
   - Salva registro em `comissoes_lojas`

4. **Visualização**: No Dashboard, o administrador pode:
   - Clicar em "Relatório de Comissões"
   - Visualizar comissões por período
   - Ver totais por loja
   - Imprimir relatório detalhado

## Exemplo de Cálculo

**Máquina com 15% de comissão:**
- Receita total: R$ 1.000,00
  - Fichas: R$ 600,00
  - Notas: R$ 300,00
  - Cartão: R$ 100,00
- Custo dos produtos: R$ 400,00
  - 20 pelúcias × R$ 20,00 cada
- **Lucro**: R$ 600,00
- **Comissão (15%)**: R$ 90,00

## Endpoints da API

### GET /api/relatorios/comissoes
Retorna relatório de comissões

**Query Parameters:**
- `dataInicio` (opcional): Data inicial (padrão: 30 dias atrás)
- `dataFim` (opcional): Data final (padrão: hoje)
- `lojaId` (opcional): Filtrar por loja específica

**Resposta:**
```json
{
  "periodo": {
    "inicio": "2026-01-01T00:00:00.000Z",
    "fim": "2026-01-31T23:59:59.999Z"
  },
  "totalGeral": {
    "totalLucro": 5000.00,
    "totalComissao": 750.00
  },
  "comissoesPorLoja": [
    {
      "lojaId": "uuid",
      "lojaNome": "Loja Shopping Center",
      "totalLucro": 3000.00,
      "totalComissao": 450.00,
      "registros": 5
    }
  ],
  "comissoes": [
    {
      "id": "uuid",
      "lojaId": "uuid",
      "lojaNome": "Loja Shopping Center",
      "dataCalculo": "2026-01-15T10:30:00.000Z",
      "totalLucro": 600.00,
      "totalComissao": 90.00,
      "detalhes": [
        {
          "maquinaId": "uuid",
          "maquinaCodigo": "M01",
          "maquinaNome": "Máquina Principal",
          "receita": 1000.00,
          "custo": 400.00,
          "lucro": 600.00,
          "percentualComissao": 15.00,
          "comissao": 90.00
        }
      ]
    }
  ]
}
```

## Observações Importantes

1. **Comissão só é calculada quando a loja é concluída no roteiro**
   - Isso garante que todos os valores estejam registrados
   - Evita cálculos parciais ou incorretos

2. **Apenas máquinas com percentualComissao > 0 são incluídas**
   - Máquinas sem comissão configurada são ignoradas

3. **O cálculo considera apenas a última movimentação do roteiro**
   - Se houver múltiplas movimentações, apenas a mais recente é usada

4. **Histórico completo**
   - Todas as comissões são salvas no banco de dados
   - Possível consultar histórico por período

5. **Acesso restrito**
   - Apenas usuários ADMIN podem ver relatórios de comissões
   - Endpoint protegido com autenticação e autorização

## Próximos Passos (Sugestões)

1. Adicionar filtro de período no modal do Dashboard
2. Exportar relatório para Excel/CSV
3. Notificações por email quando comissões são calculadas
4. Dashboard específico para acompanhamento de comissões
5. Gráficos de evolução de comissões ao longo do tempo
