#!/bin/bash
set -e

PAUSA() {
  echo ""
  echo "-----------------------------------------------"
  read -p "PAUSA: pressione ENTER para continuar..."
  echo "-----------------------------------------------"
  echo ""
}

echo "=============================================="
echo "   DEMO PROJETO B - API DE PEDIDOS (Full Cycle 4.0)"
echo "=============================================="
sleep 2

# --- ETAPA 1: Problema e nível ---
echo ">>> ETAPA 1: Problema e nível escolhido"
sed -n '1,12p' README.md
PAUSA

# --- ETAPA 2: Estrutura do repositório ---
echo ">>> ETAPA 2: Estrutura do repositório"
find . -maxdepth 2 -type f -not -path './node_modules/*' -not -path './dist/*' -not -path './coverage/*' | sort
PAUSA

# --- ETAPA 3: Subir aplicação ---
echo ">>> ETAPA 3: Subindo aplicação com Docker Compose"
docker compose down -v >/dev/null 2>&1
docker compose up -d --build
sleep 5
docker compose ps
sleep 2
curl -sS http://localhost:3000/health | python3 -m json.tool
PAUSA

# --- ETAPA 4: Criar pedido ---
echo ">>> ETAPA 4: Criando um pedido"
curl -sS -X POST http://localhost:3000/pedidos \
  -H 'Content-Type: application/json' \
  -d '{
    "clienteNome": "Maria Silva",
    "itens": [
      { "descricao": "Café", "valorUnitario": 10.00, "quantidade": 2 },
      { "descricao": "Pão de queijo", "valorUnitario": 5.00, "quantidade": 1 }
    ]
  }' | tee /tmp/pedido-demo.json | python3 -m json.tool
ID=$(python3 -c 'import json; print(json.load(open("/tmp/pedido-demo.json"))["id"])')
echo "ID gerado: $ID"
PAUSA

# --- ETAPA 5: Consultar pedido ---
echo ">>> ETAPA 5: Consultando o pedido pelo ID"
sleep 1
curl -sS "http://localhost:3000/pedidos/$ID" | python3 -m json.tool
PAUSA

# --- ETAPA 6: Observabilidade ---
echo ">>> ETAPA 6: Observabilidade (health e metricas)"
curl -sS http://localhost:3000/health | python3 -m json.tool
sleep 1
curl -sS http://localhost:3000/metrics | grep -E 'http_requests_total|http_request_duration' | head -5
PAUSA

# --- ETAPA 7: Testes unitários ---
echo ">>> ETAPA 7: Testes unitários de domínio"
npm run test -- tests/unit/pedido.test.ts
PAUSA

# --- ETAPA 8: Teste de integração ---
echo ">>> ETAPA 8: Teste de integração do fluxo principal"
npm run test -- tests/integration/pedidos.test.ts
PAUSA

# --- ETAPA 9: Cobertura ---
echo ">>> ETAPA 9: Cobertura de código"
npm run test:coverage
PAUSA

# --- ETAPA 10: OpenAPI ---
echo ">>> ETAPA 10: Validação do contrato OpenAPI"
npm run openapi:lint
head -25 docs/openapi.yaml
PAUSA

# --- ETAPA 11: ADR ---
echo ">>> ETAPA 11: Decisão técnica (ADR 0001)"
sed -n '1,50p' docs/adr/0001-decisao.md
PAUSA

# --- ETAPA 12: Contribuidores ---
echo ">>> ETAPA 12: Contribuidores e encerramento"
sed -n '1,12p' CONTRIBUTORS.md
echo ""
echo "=============================================="
echo "   FIM DA DEMONSTRACAO"
echo "=============================================="
EOF
chmod +x demo-video.sh