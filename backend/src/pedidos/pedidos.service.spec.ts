import { ConflictException, ForbiddenException } from '@nestjs/common';
import { jest } from '@jest/globals';
import { PrismaService } from '../prisma/prisma.service';
import { StatusPedido, TipoIngresso } from '../generated/prisma/enums';
import { PedidosService } from './pedidos.service';
import { OCUPACAO_POLTRONA_CONFLICT_MESSAGE } from './ocupacao-poltrona-conflict';

describe('PedidosService', () => {
  const pedidoFindUnique = jest.fn();
  const pedidoFindMany = jest.fn();
  const pedidoUpdateMany = jest.fn();
  const pedidoFindUniqueOrThrow = jest.fn();
  const ocupacaoDeleteMany = jest.fn();
  const transaction = jest.fn();

  const transactionClient = {
    pedido: {
      updateMany: pedidoUpdateMany,
      findUniqueOrThrow: pedidoFindUniqueOrThrow,
    },
    ocupacaoPoltrona: {
      deleteMany: ocupacaoDeleteMany,
    },
  };

  const prisma = {
    pedido: {
      findUnique: pedidoFindUnique,
      findMany: pedidoFindMany,
    },
    $transaction: transaction,
  } as unknown as PrismaService;

  let service: PedidosService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PedidosService(prisma);
    pedidoFindUnique.mockResolvedValue({ userId: 10 });
    pedidoFindMany.mockResolvedValue([]);
    pedidoUpdateMany.mockResolvedValue({ count: 1 });
    pedidoFindUniqueOrThrow.mockResolvedValue({ id: 1 });
    ocupacaoDeleteMany.mockResolvedValue({ count: 1 });
    transaction.mockImplementation(
      (callback: (client: typeof transactionClient) => Promise<unknown>) =>
        callback(transactionClient),
    );
  });

  it('não carrega dados do usuário nas respostas de pedidos', async () => {
    await service.findAll({ userId: 10, profile: 'USER' });

    const query = pedidoFindMany.mock.calls[0][0] as {
      include: Record<string, unknown>;
    };
    expect(query.include).not.toHaveProperty('user');
    expect(JSON.stringify(query)).not.toContain('password');
  });

  it('paga somente um pedido ABERTO por atualização condicional', async () => {
    await expect(
      service.pay(1, { userId: 10, profile: 'USER' }),
    ).resolves.toEqual({ id: 1 });

    expect(pedidoUpdateMany).toHaveBeenCalledWith({
      where: { id: 1, status: StatusPedido.ABERTO },
      data: { status: StatusPedido.PAGO },
    });
    expect(ocupacaoDeleteMany).not.toHaveBeenCalled();
  });

  it('retorna conflito quando outra transição vence a disputa', async () => {
    pedidoUpdateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.pay(1, { userId: 10, profile: 'USER' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(pedidoFindUniqueOrThrow).not.toHaveBeenCalled();
  });

  it('cancela e remove ocupações na mesma transação', async () => {
    await service.remove(1, { userId: 10, profile: 'USER' });

    expect(pedidoUpdateMany).toHaveBeenCalledWith({
      where: { id: 1, status: StatusPedido.ABERTO },
      data: { status: StatusPedido.CANCELADO },
    });
    expect(ocupacaoDeleteMany).toHaveBeenCalledWith({
      where: { pedidoId: 1 },
    });
  });

  it('impede usuário alheio antes de tentar a transição', async () => {
    await expect(
      service.remove(1, { userId: 99, profile: 'USER' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(transaction).not.toHaveBeenCalled();
  });

  it.each([StatusPedido.PAGO, StatusPedido.CANCELADO])(
    'permite ao administrador aplicar a transição ABERTO -> %s',
    async (destination) => {
      await service.update(1, { status: destination });

      expect(pedidoUpdateMany).toHaveBeenCalledWith({
        where: { id: 1, status: StatusPedido.ABERTO },
        data: { status: destination },
      });
    },
  );

  it('impede que a atualização administrativa restaure ABERTO', async () => {
    await expect(
      service.update(1, { status: StatusPedido.ABERTO }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(transaction).not.toHaveBeenCalled();
  });

  it('cria ocupações em ordem determinística antes dos itens históricos', async () => {
    const ocupacaoCreate = jest.fn().mockResolvedValue({});
    const ingressoCreateMany = jest.fn().mockResolvedValue({ count: 2 });
    const pedidoCreate = jest.fn().mockResolvedValue({ id: 99 });
    const pedidoResult = { id: 99, status: StatusPedido.ABERTO };
    const createTransactionClient = {
      pedido: {
        create: pedidoCreate,
        findUniqueOrThrow: jest.fn().mockResolvedValue(pedidoResult),
      },
      ocupacaoPoltrona: { create: ocupacaoCreate },
      ingresso: { createMany: ingressoCreateMany },
      pedidoProduto: { createMany: jest.fn() },
    };
    const poltronaFindUnique = jest.fn(({ where }: { where: { id: number } }) =>
      Promise.resolve({
        id: where.id,
        salaId: 30,
      }),
    );
    const createTransaction = jest.fn(
      (
        callback: (client: typeof createTransactionClient) => Promise<unknown>,
      ) => callback(createTransactionClient),
    );
    const createPrisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ id: 10 }) },
      sessao: {
        findUnique: jest.fn().mockResolvedValue({
          id: 20,
          salaId: 30,
          valorInteira: 25,
          valorMeia: 12.5,
        }),
      },
      poltrona: { findUnique: poltronaFindUnique },
      $transaction: createTransaction,
    } as unknown as PrismaService;
    const createService = new PedidosService(createPrisma);

    await expect(
      createService.create(
        {
          ingressos: [
            { sessaoId: 20, poltronaId: 42, tipo: TipoIngresso.INTEIRA },
            { sessaoId: 20, poltronaId: 40, tipo: TipoIngresso.MEIA },
          ],
        },
        10,
      ),
    ).resolves.toBe(pedidoResult);

    expect(ocupacaoCreate.mock.calls).toEqual([
      [{ data: { pedidoId: 99, sessaoId: 20, poltronaId: 40 } }],
      [{ data: { pedidoId: 99, sessaoId: 20, poltronaId: 42 } }],
    ]);
    expect(ingressoCreateMany).toHaveBeenCalledTimes(1);
    expect(ocupacaoCreate.mock.invocationCallOrder[1]).toBeLessThan(
      ingressoCreateMany.mock.invocationCallOrder[0],
    );
  });

  it('mapeia somente a unicidade da ocupação para conflito de poltrona', async () => {
    const createPrisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ id: 10 }) },
      sessao: {
        findUnique: jest.fn().mockResolvedValue({
          id: 20,
          salaId: 30,
          valorInteira: 25,
          valorMeia: 12.5,
        }),
      },
      poltrona: {
        findUnique: jest.fn().mockResolvedValue({ id: 40, salaId: 30 }),
      },
      $transaction: jest.fn().mockRejectedValue({
        code: 'P2002',
        meta: {
          modelName: 'OcupacaoPoltrona',
          target: ['sessaoId', 'poltronaId'],
        },
      }),
    } as unknown as PrismaService;
    const createService = new PedidosService(createPrisma);

    await expect(
      createService.create(
        {
          ingressos: [
            { sessaoId: 20, poltronaId: 40, tipo: TipoIngresso.INTEIRA },
          ],
        },
        10,
      ),
    ).rejects.toMatchObject({
      status: 409,
      message: OCUPACAO_POLTRONA_CONFLICT_MESSAGE,
    });
  });

  it('não mascara outra violação P2002 como disputa de poltrona', async () => {
    const genericError = {
      code: 'P2002',
      meta: { modelName: 'User', target: ['email'] },
    };
    const createPrisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ id: 10 }) },
      sessao: {
        findUnique: jest.fn().mockResolvedValue({
          id: 20,
          salaId: 30,
          valorInteira: 25,
          valorMeia: 12.5,
        }),
      },
      poltrona: {
        findUnique: jest.fn().mockResolvedValue({ id: 40, salaId: 30 }),
      },
      $transaction: jest.fn().mockRejectedValue(genericError),
    } as unknown as PrismaService;
    const createService = new PedidosService(createPrisma);

    await expect(
      createService.create(
        {
          ingressos: [
            { sessaoId: 20, poltronaId: 40, tipo: TipoIngresso.INTEIRA },
          ],
        },
        10,
      ),
    ).rejects.toBe(genericError);
  });
});
