import type { PedidoRepository } from '../../application/pedido-repository';
import type { ItemPedido, Pedido, StatusPedido } from '../../domain/pedido';
import type { DatabaseConnection } from './database';

interface PedidoRow {
  id: string;
  cliente_nome: string;
  itens_json: string;
  total: number;
  status: string;
  criado_em: string;
}

export class PedidoRepositorySqlite implements PedidoRepository {
  constructor(private readonly db: DatabaseConnection) {}

  async salvar(pedido: Pedido): Promise<void> {
    this.db
      .prepare(
        `INSERT INTO pedidos
          (id, cliente_nome, itens_json, total, status, criado_em)
         VALUES
          (@id, @clienteNome, @itensJson, @total, @status, @criadoEm)`,
      )
      .run({
        id: pedido.id,
        clienteNome: pedido.clienteNome,
        itensJson: JSON.stringify(pedido.itens),
        total: pedido.total,
        status: pedido.status,
        criadoEm: pedido.criadoEm,
      });
  }

  async buscarPorId(id: string): Promise<Pedido | null> {
    const row = this.db
      .prepare(
        `SELECT id, cliente_nome, itens_json, total, status, criado_em
         FROM pedidos
         WHERE id = ?`,
      )
      .get(id) as PedidoRow | undefined;

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      clienteNome: row.cliente_nome,
      itens: JSON.parse(row.itens_json) as ItemPedido[],
      total: row.total,
      status: row.status as StatusPedido,
      criadoEm: row.criado_em,
    };
  }
}
