import { Counter, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

export interface Metricas {
  registry: Registry;
  requisicoesTotal: Counter<'metodo' | 'rota' | 'status'>;
  duracaoRequisicaoSegundos: Histogram<'metodo' | 'rota' | 'status'>;
}

export function criarMetricas(): Metricas {
  const registry = new Registry();
  collectDefaultMetrics({ register: registry });

  const requisicoesTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total de requisições HTTP recebidas.',
    labelNames: ['metodo', 'rota', 'status'],
    registers: [registry],
  });

  const duracaoRequisicaoSegundos = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duração das requisições HTTP em segundos.',
    labelNames: ['metodo', 'rota', 'status'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
    registers: [registry],
  });

  return {
    registry,
    requisicoesTotal,
    duracaoRequisicaoSegundos,
  };
}
