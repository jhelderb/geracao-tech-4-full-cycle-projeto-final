import type { Pedido } from '../domain/pedido';
import type { PedidoRepository } from './pedido-repository';

export class BuscarPedidoUseCase {
  constructor(private readonly repository: PedidoRepository) {}

  async executar(id: string): Promise<Pedido | null> {
    return this.repository.buscarPorId(id);
  }
}
