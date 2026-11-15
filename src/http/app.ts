import type { Logger } from 'pino';
import express, { type NextFunction, type Request, type Response } from 'express';
import pinoHttp from 'pino-http';
import { ZodError, z } from 'zod';
import type { BuscarPedidoUseCase } from '../application/buscar-pedido';
import type { CriarPedidoUseCase } from '../application/criar-pedido';
import { DomainError } from '../domain/errors';
import type { Metricas } from './metrics';

export interface DependenciasApp {
  criarPedido: CriarPedidoUseCase;
  buscarPedido: BuscarPedidoUseCase;
  metricas: Metricas;
  logger: Logger;
}

const valorUnitarioSchema = z
  .number()
  .positive()
  .max(1_000_000)
  .refine(
    (val) => {
      const str = String(val);
      return !str.includes('.') || str.split('.')[1].length <= 2;
    },
    {
      message: 'Valor deve ter no máximo 2 casas decimais',
    },
  );

const itemSchema = z
  .object({
    descricao: z.string().trim().min(2).max(200),
    valorUnitario: valorUnitarioSchema,
    quantidade: z.number().int().positive().max(999),
  })
  .strict();

const criarPedidoSchema = z
  .object({
    clienteNome: z.string().trim().min(2).max(120),
    itens: z.array(itemSchema).min(1).max(50),
  })
  .strict();

export function criarApp(dependencias: DependenciasApp): express.Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '32kb' }));
  app.use(
    pinoHttp({
      logger: dependencias.logger,
      redact: ['req.headers.authorization'],
    }),
  );

  app.use((req: Request, res: Response, next: NextFunction) => {
    const inicio = process.hrtime.bigint();

    res.on('finish', () => {
      const duracaoSegundos = Number(process.hrtime.bigint() - inicio) / 1_000_000_000;
      const rota = req.route?.path ? `${req.baseUrl}${req.route.path}` : 'nao_encontrada';
      const labels = {
        metodo: req.method,
        rota,
        status: String(res.statusCode),
      };

      dependencias.metricas.requisicoesTotal.inc(labels);
      dependencias.metricas.duracaoRequisicaoSegundos.observe(labels, duracaoSegundos);
    });

    next();
  });

  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/metrics', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.setHeader('Content-Type', dependencias.metricas.registry.contentType);
      res.send(await dependencias.metricas.registry.metrics());
    } catch (erro) {
      next(erro);
    }
  });

  app.post('/pedidos', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dados = criarPedidoSchema.parse(req.body);
      const pedido = await dependencias.criarPedido.executar(dados);
      res.status(201).json(pedido);
    } catch (erro) {
      next(erro);
    }
  });

  app.get('/pedidos/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pedido = await dependencias.buscarPedido.executar(req.params.id);

      if (!pedido) {
        res.status(404).json({
          erro: 'PEDIDO_NAO_ENCONTRADO',
          mensagem: 'Pedido não encontrado.',
        });
        return;
      }

      res.json(pedido);
    } catch (erro) {
      next(erro);
    }
  });

  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      erro: 'ROTA_NAO_ENCONTRADA',
      mensagem: 'Rota não encontrada.',
    });
  });

  app.use((erro: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      next(erro);
      return;
    }

    if (erro instanceof ZodError) {
      res.status(400).json({
        erro: 'VALIDACAO',
        mensagem: 'Dados inválidos.',
        detalhes: erro.issues.map((issue) => ({
          campo: issue.path.join('.') || 'corpo',
          mensagem: issue.message,
        })),
      });
      return;
    }

    if (erro instanceof DomainError) {
      res.status(400).json({
        erro: erro.codigo,
        mensagem: erro.message,
      });
      return;
    }

    if (erro instanceof SyntaxError && 'type' in erro && erro.type === 'entity.parse.failed') {
      res.status(400).json({
        erro: 'JSON_INVALIDO',
        mensagem: 'O corpo da requisição deve ser um JSON válido.',
      });
      return;
    }

    if (
      erro instanceof Error &&
      'type' in erro &&
      erro.type === 'entity.too.large'
    ) {
      res.status(413).json({
        erro: 'CORPO_MUITO_GRANDE',
        mensagem: 'O corpo da requisição excede o limite permitido.',
      });
      return;
    }

    dependencias.logger.error({ erro }, 'Erro não tratado');
    res.status(500).json({
      erro: 'ERRO_INTERNO',
      mensagem: 'Erro interno do servidor.',
    });
  });

  return app;
}
