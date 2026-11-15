**Nível: Projeto B — simples**

# API de Pedidos

API de domínio único para criar e consultar pedidos de uma lanchonete. O fluxo principal cobre a criação de um pedido com itens, o cálculo do total no domínio e a consulta posterior pelo identificador.

## Stack

- Node.js 22 + TypeScript
- Express
- SQLite com `better-sqlite3`
- Zod para validação de entrada
- Pino para logs estruturados
- Prometheus (`prom-client`) para métricas
- Vitest + Supertest para testes
- Docker Compose para execução com um comando

## Pré-requisitos

- Docker e Docker Compose para o caminho recomendado (funciona em Linux e Windows).
- Node.js 22 e npm apenas para executar localmente sem Docker.

## Suporte a ambientes (Linux e Windows)

O projeto foi desenvolvido e validado em **Linux Ubuntu** e está preparado para rodar em **Windows** via **Docker Compose**.

| Ambiente | Como executar | Observação |
|----------|---------------|------------|
| **Linux (Ubuntu)** | `docker compose up --build` ou `npm ci` + `npm run dev` | Caminho nativo, sem restrições. |
| **Windows** | `docker compose up --build` | **Recomendado.** O build do `better-sqlite3` (módulo nativo) acontece dentro do container Linux, sem necessidade de Build Tools no Windows. |
| **Windows (sem Docker)** | `npm ci` + `npm run dev` | Não recomendado: `better-sqlite3` requer compilação nativa e pode falhar sem o workload "Desktop development with C++" do Visual Studio instalado. |

Em ambos os ambientes, a API fica disponível em `http://localhost:3000` e o banco SQLite é persistido no volume Docker `pedidos-data`.

## Executar com Docker Compose

```bash
docker compose up --build
```

A API fica disponível em `http://localhost:3000`. O banco SQLite é persistido no volume `pedidos-data`.

Para encerrar:

```bash
docker compose down
```

Para remover também os dados persistidos:

```bash
docker compose down -v
```

## Executar localmente

```bash
cp .env.example .env
npm ci
npm run dev
```

Para simular produção:

```bash
npm run build
npm start
```

## Variáveis de ambiente

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `PORT` | `3000` | Porta HTTP da API |
| `DATABASE_PATH` | `./data/pedidos.db` | Caminho do arquivo SQLite |
| `LOG_LEVEL` | `info` | Nível dos logs do Pino |
| `NODE_ENV` | `development` | Ambiente de execução |

As variáveis estão documentadas em `.env.example`. Nenhum segredo é versionado.

## API

| Método | Rota | Descrição |
| --- | --- | --- |
| `POST` | `/pedidos` | Cria um pedido |
| `GET` | `/pedidos/:id` | Consulta um pedido |
| `GET` | `/health` | Health check |
| `GET` | `/metrics` | Métricas Prometheus |

### Criar pedido

```bash
curl -sS -X POST http://localhost:3000/pedidos \
  -H 'Content-Type: application/json' \
  -d '{
    "clienteNome": "Maria Silva",
    "itens": [
      { "descricao": "Café", "valorUnitario": 10.00, "quantidade": 2 },
      { "descricao": "Pão de queijo", "valorUnitario": 5.00, "quantidade": 1 }
    ]
  }'
```

Resposta `201 Created` (exemplo em reais para apresentação):

```json
{
  "id": "93b88219-e81d-4cc3-9deb-6759c7df5424",
  "clienteNome": "Maria Silva",
  "itens": [
    { "descricao": "Café", "valorUnitario": 10.00, "quantidade": 2 },
    { "descricao": "Pão de queijo", "valorUnitario": 5.00, "quantidade": 1 }
  ],
  "total": 25.00,
  "status": "PENDENTE",
  "criadoEm": "2026-11-10T23:48:27.284Z"
}
```

O contrato do fluxo principal está em [`docs/openapi.yaml`](docs/openapi.yaml). Os endpoints `/health` e `/metrics` são operacionais e não fazem parte do contrato de domínio.

## Testes e qualidade

```bash
npm run lint
npm run typecheck
npm test
npm run test:coverage
npm run openapi:lint
npm run build
```

Cobertura medida em 11/11/2026:

- Statements: 91,66%
- Branches: 90,00%
- Functions: 100,00%
- Lines: 91,58%

Os limites mínimos configurados no Vitest são 85% para linhas, funções e statements, e 75% para branches.

## Smoke test com k6

Com a API em execução:

```bash
npm run k6:smoke
```

O teste valida criação (`201`) e consulta (`200`) durante 10 segundos, com 1 VU. O threshold é `p(95) < 200 ms` e taxa de falhas `< 1%`.

Resultado medido em 11/11/2026 no ambiente Docker local:

- `p(95)`: **4,96 ms** (última medição; varia entre 2,80 ms e 4,96 ms, sempre bem abaixo do limite)
- Média: 2,89 ms
- Falhas HTTP: **0,00%**
- Checks aprovados: **40/40**

Detalhes e análise em [`docs/desempenho.md`](docs/desempenho.md).

## Observabilidade

- Logs estruturados em JSON com Pino, incluindo método, rota, status e duração.
- Métricas Prometheus em `/metrics`: `http_requests_total` e histograma `http_request_duration_seconds`.
- Health check em `/health`.
- SLO do fluxo principal: **p95 < 200 ms e taxa de falhas < 1%** no smoke test.

## Arquitetura e decisões

O código é organizado em camadas:

- `src/domain`: entidades, regras de negócio e validações independentes de infraestrutura.
- `src/application`: casos de uso `CriarPedidoUseCase` e `BuscarPedidoUseCase`.
- `src/infrastructure/sqlite`: implementação do repositório SQLite.
- `src/http`: rotas Express, validação HTTP, tratamento de erros e métricas.

O padrão **Repository** foi escolhido para isolar a persistência e permitir testes de integração com SQLite em memória. A justificativa e as alternativas estão na [ADR 0001](docs/adr/0001-decisao.md).

## Contato

Dúvidas sobre o projeto: abra uma issue no repositório ou consulte o autor em [`CONTRIBUTORS.md`](CONTRIBUTORS.md).

## CI

O workflow em `.github/workflows/ci.yml` executa em push e pull request:

1. `npm ci`
2. `npm run lint`
3. `npm run openapi:lint`
4. `npm run test:coverage`
5. `npm run build`

## Estrutura

```text
projeto-final/
├── src/
│   ├── domain/
│   ├── application/
│   ├── infrastructure/sqlite/
│   └── http/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── k6/
├── docs/
│   ├── README.md
│   ├── adr/
│   ├── desempenho.md
│   ├── ia.md
│   └── openapi.yaml
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── CONTRIBUTORS.md
```

## Entregáveis do Projeto B

- [x] API de domínio único com um fluxo ponta a ponta
- [x] Docker Compose com um comando
- [x] SOLID e padrão Repository justificado em ADR
- [x] Testes unitários e teste de integração
- [x] Cobertura acima dos limites configurados
- [x] CI com instalação, lint de código, lint do OpenAPI, testes e build
- [x] `.env.example`
- [x] Logs estruturados
- [x] Métrica e SLO
- [x] README
- [x] 1 ADR
- [x] OpenAPI
- [x] Smoke test k6 com p95 medido
- [x] `docs/desempenho.md`
- [x] `CONTRIBUTORS.md`
- [x] `docs/ia.md`

## Apresentação em vídeo (opcional)

A apresentação é opcional, mas conta como bônus; o vídeo deve ser enviado pelo Moodle até **13/11**.
