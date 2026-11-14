import { DomainError } from './errors';

export type StatusPedido = 'PENDENTE';

export interface ItemPedido {
  descricao: string;
  valorUnitarioCentavos: number;
  quantidade: number;
}

export interface Pedido {
  id: string;
  clienteNome: string;
  itens: ItemPedido[];
  totalCentavos: number;
  status: StatusPedido;
  criadoEm: string;
}

export interface CriarPedidoInput {
  clienteNome: string;
  itens: ItemPedido[];
}

const LIMITE_ITENS = 50;
const LIMITE_QUANTIDADE = 999;
const LIMITE_VALOR_UNITARIO = 100_000_000;

export function criarPedido(input: CriarPedidoInput, id: string, criadoEm: Date): Pedido {
  const clienteNome = input.clienteNome.trim();

  if (clienteNome.length < 2 || clienteNome.length > 120) {
    throw new DomainError(
      'CLIENTE_INVALIDO',
      'O nome do cliente deve ter entre 2 e 120 caracteres.',
    );
  }

  if (input.itens.length < 1 || input.itens.length > LIMITE_ITENS) {
    throw new DomainError(
      'ITENS_INVALIDOS',
      `O pedido deve ter entre 1 e ${LIMITE_ITENS} itens.`,
    );
  }

  const itens = input.itens.map((item, indice) => {
    const descricao = item.descricao.trim();

    if (descricao.length < 2 || descricao.length > 200) {
      throw new DomainError(
        'ITEM_INVALIDO',
        `A descrição do item ${indice + 1} deve ter entre 2 e 200 caracteres.`,
      );
    }

    if (
      !Number.isSafeInteger(item.valorUnitarioCentavos) ||
      item.valorUnitarioCentavos < 1 ||
      item.valorUnitarioCentavos > LIMITE_VALOR_UNITARIO
    ) {
      throw new DomainError(
        'ITEM_INVALIDO',
        `O valor unitário do item ${indice + 1} deve ser um inteiro positivo em centavos.`,
      );
    }

    if (
      !Number.isSafeInteger(item.quantidade) ||
      item.quantidade < 1 ||
      item.quantidade > LIMITE_QUANTIDADE
    ) {
      throw new DomainError(
        'ITEM_INVALIDO',
        `A quantidade do item ${indice + 1} deve ser um inteiro entre 1 e ${LIMITE_QUANTIDADE}.`,
      );
    }

    return {
      descricao,
      valorUnitarioCentavos: item.valorUnitarioCentavos,
      quantidade: item.quantidade,
    };
  });

  const totalCentavos = itens.reduce(
    (total, item) => total + item.valorUnitarioCentavos * item.quantidade,
    0,
  );

  return {
    id,
    clienteNome,
    itens,
    totalCentavos,
    status: 'PENDENTE',
    criadoEm: criadoEm.toISOString(),
  };
}
