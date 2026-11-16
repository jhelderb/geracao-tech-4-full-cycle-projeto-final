# Desempenho e SLO

## Objetivo

Validar o fluxo principal da API — criação e consulta de pedido — e medir a latência do endpoint sob uma carga de smoke test. O Projeto B exige um teste k6 com p95 medido.

## Cenário testado

- Ferramenta: k6 em container `grafana/k6`
- Script: `tests/k6/smoke.js`
- Carga: 1 VU durante 10 segundos
- Intervalo entre iterações: 1 segundo
- Requisições por iteração: 1 `POST /pedidos` e 1 `GET /pedidos/{id}`
- API: container Docker local com Node.js 22 e SQLite
- Data da medição: 11/11/2026 (última validação; p95 varia entre 2,19 ms e 4,96 ms)

## Ambiente

- CPU: 13th Gen Intel Core i7-13620H
- CPUs disponíveis: 16
- Memória: 15 GiB
- Docker: 29.9.3
- Docker Compose: v5.7.0
- Imagem da API: `node:22-bookworm-slim`
- Persistência: volume Docker `pedidos-data` com SQLite

## Thresholds

```js
thresholds: {
  http_req_duration: ['p(95)<200'],
  http_req_failed: ['rate<0.01'],
}
```

## Resultado

| Métrica | Resultado |
| --- | --- |
| Checks aprovados | 40/40 (100%) |
| Requisições HTTP | 20 |
| Falhas HTTP | 0,00% |
| p(95) | **3.67 ms** (varia entre 2.19 ms e 4.96 ms em medições recentes) |
| Média | 2.19 ms |
| Mediana | 2.09 ms |
| p(90) | 3.32 ms |
| Máximo | 4.77 ms |
| Iterações | 10 |

Todos os thresholds foram aprovados:

```text
http_req_duration
✓ 'p(95)<200' p(95)=3.67ms

http_req_failed
✓ 'rate<0.01' rate=0.00%
```

## SLO adotado

**SLO do fluxo principal:** p95 abaixo de 200 ms e taxa de falhas abaixo de 1% no smoke test.

O resultado medido ficou muito abaixo do limite: p95 de 3.67 ms e 0% de falhas.

## Análise

O fluxo principal é simples e executa poucas operações:

1. validação do payload com Zod;
2. cálculo do total no domínio;
3. um `INSERT` no SQLite;
4. um `SELECT` por chave primária.

Nesse cenário, o custo dominante é o overhead HTTP e o registro de logs/métricas, não a persistência. O SQLite é adequado para a carga de smoke test e para o escopo do Projeto B.

## Limitações

- O teste usa 1 VU e não representa carga concorrente relevante.
- SQLite possui limitações de escrita concorrente e não é a escolha para múltiplas instâncias em alta escala.
- O teste foi executado em ambiente local, não em infraestrutura de produção.
- Métricas de CPU e memória do container não foram coletadas neste smoke test.

## Como reproduzir

Com a API em execução:

```bash
docker compose up --build
npm run k6:smoke
```

O comando executa:

```bash
docker run --rm -i --network host \
  -e BASE_URL=http://localhost:3000 \
  grafana/k6 run - < tests/k6/smoke.js
```

## Próximos passos, se o escopo crescer

- Executar teste de carga com mais VUs e duração maior.
- Observar `http_request_duration_seconds` e uso de CPU/memória durante o teste.
- Migrar para PostgreSQL se houver necessidade de múltiplas instâncias ou escrita concorrente intensa.
- Adicionar teste de caos ou falha do banco, se o projeto evoluir para um nível maior.
