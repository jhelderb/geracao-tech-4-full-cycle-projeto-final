# Roteiro do vídeo de apresentação

**Duração alvo:** 10 minutos  
**Formato:** gravação de tela com voz  
**Entrega:** Moodle até 13/11  
**Observação:** a apresentação é opcional, mas conta como bônus.

## Antes de gravar

- Abrir o terminal na raiz do projeto.
- Aumentar a fonte do terminal.
- Fechar abas com dados pessoais, tokens ou arquivos `.env`.
- Deixar a API parada para demonstrar o `docker compose up`.
- Testar antes: `docker compose down -v`, `docker compose up -d --build` e `curl http://localhost:3000/health`.
- Se possível, gravar em 1080p e conferir o áudio nos primeiros 30 segundos.

## 0:00–1:00 — Problema e nível escolhido

Falar:

- O projeto é uma **API de Pedidos**.
- O nível escolhido é **Projeto B — simples**.
- O fluxo principal é criar um pedido, calcular o total no domínio e consultar o pedido pelo identificador.
- O objetivo é mostrar um fluxo funcionando de ponta a ponta, com Docker, testes, CI, documentação e medição de desempenho.

Mostrar rapidamente:

```bash
sed -n '1,12p' README.md
```

Destacar a primeira linha:

```text
**Nível: Projeto B — simples**
```

## 1:00–4:00 — Demonstração: sobe, roda e responde

### Estrutura do repositório

```bash
find . -maxdepth 2 -not -path './.git/*' -not -path './node_modules/*' -not -path './dist/*' -not -path './coverage/*' | sort
```

Explicar que a estrutura segue o esperado para o Projeto B:

- `docker-compose.yml`, `Dockerfile`, `README.md`, `.env.example`, `.github/workflows/ci.yml` na raiz
- `src/` com o código da aplicação
- `tests/` com testes unitários, de integração e k6
- `docs/` com ADR, OpenAPI, desempenho, uso de IA

Mostrar que a pasta `tests/` existe com subpastas `unit/`, `integration/` e `k6/`.

### Subir a aplicação

```bash
docker compose up -d --build
docker compose ps
curl -sS http://localhost:3000/health
```

Explicar que o Compose sobe a API e o SQLite fica persistido no volume `pedidos-data`.

### Criar um pedido

```bash
curl -sS -X POST http://localhost:3000/pedidos \
  -H 'Content-Type: application/json' \
  -d '{
    "clienteNome": "Maria Silva",
    "itens": [
      { "descricao": "Café", "valorUnitario": 10.00, "quantidade": 2 },
      { "descricao": "Pão de queijo", "valorUnitario": 5.00, "quantidade": 1 }
    ]
  }' | tee /tmp/pedido.json
```

### Consultar o mesmo pedido

```bash
ID=$(python3 -c 'import json; print(json.load(open("/tmp/pedido.json"))["id"])')
curl -sS "http://localhost:3000/pedidos/$ID"
```

Explicar:

- O total foi calculado no domínio: 2 cafés a R$ 10,00 + 1 pão de queijo a R$ 5,00 = total R$ 25,00.
- Internamente o sistema armazena os valores em reais (valorUnitario, total), mas a narração usa reais, moeda corrente no Brasil-BR.
- O pedido foi persistido no SQLite.
- A consulta retorna o mesmo pedido.

### Mostrar observabilidade

```bash
curl -sS http://localhost:3000/health | python3 -m json.tool
curl -sS http://localhost:3000/metrics | grep -E 'http_requests_total|http_request_duration' | head -5
```

Explicar:

- `/health` retorna `{"status": "ok", ...}` confirmando que a aplicação está rodando.
- `/metrics` expõe métricas Prometheus. Cada linha do `http_requests_total` mostra:
  - `metodo`: verbo HTTP (GET, POST)
  - `rota`: endpoint acessado (/health, /pedidos, /pedidos/:id)
  - `status`: código de resposta HTTP (200, 201)
  - o número ao final: quantidade de requisições com esse conjunto de labels

## 4:00–7:00 — Uma decisão técnica e a alternativa descartada

Abrir a ADR:

```bash
sed -n '1,80p' docs/adr/0001-decisao.md
```

Explicar a decisão:

- **Repository** separa domínio, casos de uso e persistência.
- A interface `PedidoRepository` permite trocar SQLite sem alterar as regras de negócio.
- SQLite foi escolhido por ser simples, não exigir servidor externo e atender ao escopo do Projeto B.

Mostrar rapidamente a interface:

```bash
sed -n '1,20p' src/application/pedido-repository.ts
```

Explicar a alternativa descartada:

- **PostgreSQL + Prisma** seria mais próximo de produção, mas adicionaria container, migrações, ORM e complexidade operacional sem necessidade para um fluxo simples.
- **Arquivo JSON** seria menor, mas teria concorrência, transações e integridade mais frágeis.

Fechar dizendo que a decisão está registrada e justificada na ADR.

## 7:00–10:00 — Números e o que faria diferente

### Testes e cobertura

**Testes unitários de domínio:**

```bash
npm run test -- tests/unit/pedido.test.ts
```

Explicar o relatório do Vitest:

- `Test Files 1 passed (1)`: um arquivo de teste executado e aprovado
- `Tests 9 passed (9)`: nove casos de teste de domínio aprovados
- `Start at` / `Duration`: tempo de início e duração da execução

**Teste de integração do fluxo principal:**

```bash
npm run test -- tests/integration/pedidos.test.ts
```

Explicar o relatório do Vitest:

- `Test Files 1 passed (1)`: um arquivo de teste de integração executado e aprovado
- `Tests 8 passed (8)`: oito casos de teste de fluxo aprovados (criar, consultar, validações, 404, JSON malformado, corpo grande)
- `Start at` / `Duration`: tempo de início e duração da execução

**Cobertura de código:**

```bash
npm run test:coverage
```

Explicar que o comando executa o Vitest com o provedor v8 e gera um relatório de cobertura:

- `File`: cada arquivo-fonte analisado
- `% Stmts`: porcentagem de statements (declaracoes) cobertos
- `% Branch`: porcentagem de ramificacoes (if/else) cobertas
- `% Funcs`: porcentagem de funcoes cobertas
- `% Lines`: porcentagem de linhas cobertas
- `Uncovered Line #s`: numeros de linhas nao cobertas pelos testes

Mostrar o resumo:

- 17 testes passando (9 unitários + 8 de integração)
- Statements: 92,03%.
- Branches: 89,09%.
- Functions: 100,00%.
- Lines: 91,96%.

### Desempenho

Abrir o documento:

```bash
sed -n '1,80p' docs/desempenho.md
```

Mostrar os números medidos:

- k6: 1 VU por 10 segundos.
- 40/40 checks aprovados.
- 0% de falhas HTTP.
- p95 de 3.67 ms (varia entre 2.19 ms e 4.96 ms em medições recentes)
- Threshold: `p(95)<200` e `rate<0.01`.

Explicar as limitações:

- O teste é um smoke test, não uma carga concorrente representativa.
- SQLite atende ao escopo, mas não é a escolha para múltiplas instâncias em alta escala.
- A medição foi feita em ambiente local.

### O que faria diferente

- Teste de carga com mais VUs e duração maior.
- Migração para PostgreSQL se houver múltiplas instâncias ou escrita concorrente intensa.
- Cache ou fila somente se o fluxo crescer e a medição mostrar necessidade.

## Fechamento

Mostrar:

```bash
sed -n '1,20p' CONTRIBUTORS.md
```

Fechar com:

- Link do repositório.
- README com nível, como subir e como testar.
- CI configurada.
- Documentação em `docs/`.
- Agradecimento e disponibilidade para perguntas.

## Plano B se o tempo apertar

Se a gravação passar de 10 minutos, cortar nesta ordem:

1. A execução de `npm run test:coverage` ao vivo, mostrando apenas o resumo já aberto.
2. A leitura da interface do repositório, mantendo a explicação da ADR.
3. Os detalhes de logs, mantendo a demonstração do `/metrics`.

Não cortar: demonstração do fluxo principal, decisão técnica e números de p95/cobertura.

## Prompt de narração por etapa

### ETAPA 1 — Problema e nível
> "Este é o Projeto Final B — simples do Full Cycle 4.0. O sistema é uma API de Pedidos, de domínio único. O fluxo principal é criar um pedido com itens, calcular o total no domínio e consultar o pedido posteriormente pelo identificador. Não há microsserviços nem decomposição de módulos. O objetivo é mostrar um fluxo funcionando de ponta a ponta, com Docker, testes, CI, documentação e medição de desempenho."

### ETAPA 2 — Estrutura
> "O repositório está organizado com Docker Compose na raiz, documentação em docs/, código-fonte em src/ e testes em tests/. Não há docs/c4/, conforme exigido para o nível B."

### ETAPA 3 — Subir aplicação
> "Vou subir a aplicação com um único comando Docker Compose. O banco SQLite é persistido em um volume Docker, então os dados sobrevivem a reinícios do container. Depois, verifico o health check."

### ETAPA 4 — Criar pedido
> "Agora crio um pedido com dois itens: 2 cafés a R$ 10,00 cada e 1 pão de queijo a R$ 5,00. O total deve ser R$ 25,00, calculado no domínio."

### ETAPA 5 — Consultar pedido
> "Consulto o mesmo pedido pelo ID retornado. O sistema devolve exatamente o mesmo objeto, provando que a persistência funcionou."

### ETAPA 6 — Observabilidade
> "A aplicação expõe logs estruturados com Pino, métricas Prometheus em /metrics e um health check em /health. Isso atende ao requisito de logs estruturados, 1 métrica e 1 SLO."

### ETAPA 7 — Testes unitários
> "Rodo agora os testes unitários de domínio. Eles validam criação de pedido, normalização de espaços, rejeição de nome curto/longo, pedido sem itens, itens demais, descrição inválida, valor inválido e quantidade inválida."

### ETAPA 8 — Teste de integração
> "Agora o teste de integração. Ele cria um pedido via HTTP, consulta pelo ID, valida payload inválido (400), recurso não encontrado (404), rota inexistente (404), JSON malformado (400) e corpo muito grande (413)."

### ETAPA 9 — Cobertura
> "A cobertura de código está acima dos limites configurados: statements 92,03%, branches 89,09%, functions 100% e lines 91,96%."

### ETAPA 10 — OpenAPI
> "O contrato OpenAPI 3.1 do fluxo principal está válido, com 0 warnings no Redocly CLI. Documenta criação e consulta de pedido, com respostas de erro."

### ETAPA 11 — ADR
> "A decisão técnica foi aplicar o padrão Repository com SQLite. Isola as regras de negócio da persistência e permite testes rápidos em memória. A alternativa PostgreSQL + Prisma seria mais próxima de produção, mas adicionaria complexidade desnecessária para este fluxo simples."

### ETAPA 12 — Contribuidores
> "O projeto foi entregue individualmente. O autor registrado no CONTRIBUTORS.md é José H. B. (josehb), responsável por todo o desenvolvimento e documentação. Não houve participação de grupo. Obrigado e fico à disposição para perguntas."

## Plano B se o tempo apertar

Se a gravação passar de 10 minutos, cortar nesta ordem:

1. A execução de `npm run test:coverage` ao vivo, mostrando apenas o resumo já aberto.
2. A leitura da interface do repositório, mantendo a explicação da ADR.
3. Os detalhes de logs, mantendo a demonstração do `/metrics`.

Não cortar: demonstração do fluxo principal, decisão técnica e números de p95/cobertura.
