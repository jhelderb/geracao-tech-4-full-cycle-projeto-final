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
      { "descricao": "Café", "valorUnitarioCentavos": 1000, "quantidade": 2 },
      { "descricao": "Pão de queijo", "valorUnitarioCentavos": 500, "quantidade": 1 }
    ]
  }' | tee /tmp/pedido.json
```

### Consultar o mesmo pedido

```bash
ID=$(python3 -c 'import json; print(json.load(open("/tmp/pedido.json"))["id"])')
curl -sS "http://localhost:3000/pedidos/$ID"
```

Explicar:

- O total foi calculado no domínio: `2 × 1000 + 1 × 500 = 2500`.
- O pedido foi persistido no SQLite.
- A consulta retorna o mesmo pedido.

### Mostrar observabilidade

```bash
curl -sS http://localhost:3000/metrics | head -20
```

Mostrar que existem logs estruturados e a métrica `http_requests_total`.

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

```bash
npm run test:coverage
```

Mostrar o resumo:

- 16 testes passando.
- Statements: 91,66%.
- Branches: 90,00%.
- Functions: 100,00%.
- Lines: 91,58%.

### Desempenho

Abrir o documento:

```bash
sed -n '1,80p' docs/desempenho.md
```

Mostrar os números medidos:

- k6: 1 VU por 10 segundos.
- 40/40 checks aprovados.
- 0% de falhas HTTP.
- p95 de 4,96 ms (varia entre 2,80 ms e 4,96 ms em medições recentes)
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
