import http from 'k6/http';
import { check, sleep } from 'k6';

const baseUrl = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  vus: 1,
  duration: '10s',
  thresholds: {
    http_req_duration: ['p(95)<200'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const payload = JSON.stringify({
    clienteNome: 'Cliente Smoke Test',
    itens: [
      { descricao: 'Café', valorUnitarioCentavos: 1000, quantidade: 1 },
      { descricao: 'Pão de queijo', valorUnitarioCentavos: 500, quantidade: 2 },
    ],
  });

  const criacao = http.post(`${baseUrl}/pedidos`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(criacao, {
    'criação retorna 201': (resposta) => resposta.status === 201,
    'criação retorna id': (resposta) => typeof resposta.json('id') === 'string',
  });

  const id = criacao.json('id');
  if (!id) return;
  const consulta = http.get(`${baseUrl}/pedidos/${id}`);

  check(consulta, {
    'consulta retorna 200': (resposta) => resposta.status === 200,
    'consulta retorna o mesmo id': (resposta) => resposta.json('id') === id,
  });

  sleep(1);
}
