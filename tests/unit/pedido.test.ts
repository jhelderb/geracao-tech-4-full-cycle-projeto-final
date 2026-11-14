import { describe, expect, it } from 'vitest';
import { DomainError } from '../../src/domain/errors';
import { criarPedido } from '../../src/domain/pedido';

const dataFixa = new Date('2026-11-10T12:00:00.000Z');

describe('criarPedido', () => {
  it('cria pedido com total calculado e dados normalizados', () => {
    const pedido = criarPedido(
      {
        clienteNome: '  Maria Silva  ',
        itens: [
          { descricao: '  Café  ', valorUnitarioCentavos: 1000, quantidade: 2 },
          { descricao: 'Pão de queijo', valorUnitarioCentavos: 500, quantidade: 1 },
        ],
      },
      'pedido-1',
      dataFixa,
    );

    expect(pedido).toEqual({
      id: 'pedido-1',
      clienteNome: 'Maria Silva',
      itens: [
        { descricao: 'Café', valorUnitarioCentavos: 1000, quantidade: 2 },
        { descricao: 'Pão de queijo', valorUnitarioCentavos: 500, quantidade: 1 },
      ],
      totalCentavos: 2500,
      status: 'PENDENTE',
      criadoEm: '2026-11-10T12:00:00.000Z',
    });
  });

  it('rejeita nome de cliente curto', () => {
    expect(() =>
      criarPedido(
        {
          clienteNome: ' A ',
          itens: [{ descricao: 'Café', valorUnitarioCentavos: 1000, quantidade: 1 }],
        },
        'pedido-1',
        dataFixa,
      ),
    ).toThrowError(DomainError);
  });

  it('rejeita nome de cliente longo', () => {
    expect(() =>
      criarPedido(
        {
          clienteNome: 'a'.repeat(121),
          itens: [{ descricao: 'Café', valorUnitarioCentavos: 1000, quantidade: 1 }],
        },
        'pedido-1',
        dataFixa,
      ),
    ).toThrowError('O nome do cliente deve ter entre 2 e 120 caracteres.');
  });

  it('rejeita pedido sem itens', () => {
    expect(() =>
      criarPedido({ clienteNome: 'Maria', itens: [] }, 'pedido-1', dataFixa),
    ).toThrowError('O pedido deve ter entre 1 e 50 itens.');
  });

  it('rejeita pedido com itens demais', () => {
    const itens = Array.from({ length: 51 }, (_, indice) => ({
      descricao: `Item ${indice}`,
      valorUnitarioCentavos: 100,
      quantidade: 1,
    }));

    expect(() => criarPedido({ clienteNome: 'Maria', itens }, 'pedido-1', dataFixa)).toThrowError(
      'O pedido deve ter entre 1 e 50 itens.',
    );
  });

  it('rejeita descrição de item inválida', () => {
    expect(() =>
      criarPedido(
        {
          clienteNome: 'Maria',
          itens: [{ descricao: ' ', valorUnitarioCentavos: 1000, quantidade: 1 }],
        },
        'pedido-1',
        dataFixa,
      ),
    ).toThrowError('A descrição do item 1 deve ter entre 2 e 200 caracteres.');
  });

  it('rejeita valor unitário inválido', () => {
    expect(() =>
      criarPedido(
        {
          clienteNome: 'Maria',
          itens: [{ descricao: 'Café', valorUnitarioCentavos: 0, quantidade: 1 }],
        },
        'pedido-1',
        dataFixa,
      ),
    ).toThrowError('O valor unitário do item 1 deve ser um inteiro positivo em centavos.');
  });

  it('rejeita quantidade inválida', () => {
    expect(() =>
      criarPedido(
        {
          clienteNome: 'Maria',
          itens: [{ descricao: 'Café', valorUnitarioCentavos: 1000, quantidade: 0 }],
        },
        'pedido-1',
        dataFixa,
      ),
    ).toThrowError('A quantidade do item 1 deve ser um inteiro entre 1 e 999.');
  });
});
