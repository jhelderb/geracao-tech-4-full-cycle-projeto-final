import 'dotenv/config';
import pino from 'pino';
import { BuscarPedidoUseCase } from './application/buscar-pedido';
import { CriarPedidoUseCase } from './application/criar-pedido';
import { PedidoRepositorySqlite } from './infrastructure/sqlite/pedido-repository-sqlite';
import { abrirBanco } from './infrastructure/sqlite/database';
import { criarApp } from './http/app';
import { criarMetricas } from './http/metrics';

const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
});

const porta = Number(process.env.PORT ?? 3000);
const caminhoBanco = process.env.DATABASE_PATH ?? './data/pedidos.db';

const db = abrirBanco(caminhoBanco);
const repository = new PedidoRepositorySqlite(db);
const app = criarApp({
  criarPedido: new CriarPedidoUseCase(repository),
  buscarPedido: new BuscarPedidoUseCase(repository),
  metricas: criarMetricas(),
  logger,
});

const server = app.listen(porta, '0.0.0.0', () => {
  logger.info({ porta, caminhoBanco }, 'API de pedidos iniciada');
});

function encerrar(sinal: string): void {
  logger.info({ sinal }, 'Encerrando API');

  server.close(() => {
    db.close();
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Tempo limite de encerramento excedido');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => encerrar('SIGTERM'));
process.on('SIGINT', () => encerrar('SIGINT'));
