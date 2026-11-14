import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import pino from 'pino';
import request from 'supertest';
import { BuscarPedidoUseCase } from '../../src/application/buscar-pedido';
import { CriarPedidoUseCase } from '../../src/application/criar-pedido';
import { abrirBanco, type DatabaseConnection } from '../../src/infrastructure/sqlite/database';
import { PedidoRepositorySqlite } from '../../src/infrastructure/sqlite/pedido-repository-sqlite';
import { criarApp } from '../../src/http/app';
import { criarMetricas } from '../../src/http/metrics';

describe('API de pedidos', () => {
  let db: DatabaseConnection;
  let app: ReturnType<typeof criarApp>;

  beforeEach(() => {
    db = abrirBanco(':memory:');
    const repository = new PedidoRepositorySqlite(db);

    app = criarApp({
      criarPedido: new CriarPedidoUseCase(repository),
      buscarPedido: new BuscarPedidoUseCase(repository),
      metricas: criarMetricas(),
      logger: pino({ level: 'silent' }),
    });
  });

  afterEach(() => {
    db.close();
  });

  it('responde ao health check', async () => {
    const resposta = await request(app).get('/health');

    expect(resposta.status).toBe(200);
    expect(resposta.body.status).toBe('ok');
    expect(typeof resposta.body.uptimeSeconds).toBe('number');
    expect(typeof resposta.body.timestamp).toBe('string');
  });

  it('expõe métricas Prometheus', async () => {
    const resposta = await request(app).get('/metrics');

    expect(resposta.status).toBe(200);
    expect(resposta.headers['content-type']).toContain('text/plain');
    expect(resposta.text).toContain('http_requests_total');
  });

  it('cria e consulta um pedido no fluxo principal', async () => {
    const criacao = await request(app).post('/pedidos').send({
      clienteNome: 'Maria Silva',
      itens: [
        { descricao: 'Café', valorUnitarioCentavos: 1000, quantidade: 2 },
        { descricao: 'Pão de queijo', valorUnitarioCentavos: 500, quantidade: 1 },
      ],
    });

    expect(criacao.status).toBe(201);
    expect(criacao.body.id).toEqual(expect.any(String));
    expect(criacao.body.totalCentavos).toBe(2500);
    expect(criacao.body.status).toBe('PENDENTE');

    const consulta = await request(app).get(`/pedidos/${criacao.body.id}`);

    expect(consulta.status).toBe(200);
    expect(consulta.body).toEqual(criacao.body);
  });

  it('rejeita payload inválido', async () => {
    const resposta = await request(app).post('/pedidos').send({
      clienteNome: 'M',
      itens: [],
    });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toBe('VALIDACAO');
    expect(resposta.body.detalhes.length).toBeGreaterThan(0);
  });

  it('retorna 404 para pedido inexistente', async () => {
    const resposta = await request(app).get('/pedidos/00000000-0000-0000-0000-000000000000');

    expect(resposta.status).toBe(404);
    expect(resposta.body.erro).toBe('PEDIDO_NAO_ENCONTRADO');
  });

  it('retorna 404 para rota inexistente', async () => {
    const resposta = await request(app).get('/rota-inexistente');

    expect(resposta.status).toBe(404);
    expect(resposta.body.erro).toBe('ROTA_NAO_ENCONTRADA');
  });

  it('rejeita JSON malformado', async () => {
    const resposta = await request(app)
      .post('/pedidos')
      .set('Content-Type', 'application/json')
      .send('{"clienteNome":');

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toBe('JSON_INVALIDO');
  });

  it('rejeita corpo maior que o limite', async () => {
    const resposta = await request(app)
      .post('/pedidos')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ clienteNome: 'a'.repeat(40_000), itens: [] }));

    expect(resposta.status).toBe(413);
    expect(resposta.body.erro).toBe('CORPO_MUITO_GRANDE');
  });
});
