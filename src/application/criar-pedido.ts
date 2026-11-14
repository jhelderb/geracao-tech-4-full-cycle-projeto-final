import { randomUUID } from 'node:crypto';
import { criarPedido, type CriarPedidoInput, type Pedido } from '../domain/pedido';
import type { PedidoRepository } from './pedido-repository';

export class CriarPedidoUseCase {
  constructor(
    private readonly repository: PedidoRepository,
    private readonly gerarId: () => string = randomUUID,
    private readonly obterDataAtual: () => Date = () => new Date(),
  ) {}

  async executar(input: CriarPedidoInput): Promise<Pedido> {
    const pedido = criarPedido(input, this.gerarId(), this.obterDataAtual());
    await this.repository.salvar(pedido);
    return pedido;
  }
}
