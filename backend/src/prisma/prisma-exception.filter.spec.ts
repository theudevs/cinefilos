import { ArgumentsHost } from '@nestjs/common';
import { jest } from '@jest/globals';
import { PrismaExceptionFilter } from './prisma-exception.filter';
import { OCUPACAO_POLTRONA_CONFLICT_MESSAGE } from '../pedidos/ocupacao-poltrona-conflict';

describe('PrismaExceptionFilter', () => {
  const status = jest.fn();
  const json = jest.fn();
  const response = { status, json };
  const host = {
    switchToHttp: () => ({ getResponse: () => response }),
  } as unknown as ArgumentsHost;

  beforeEach(() => {
    jest.clearAllMocks();
    status.mockReturnValue(response);
  });

  it('retorna a mensagem de disputa apenas para a constraint de ocupação', () => {
    const filter = new PrismaExceptionFilter();

    filter.catch(
      {
        code: 'P2002',
        meta: {
          driverAdapterError: {
            cause: {
              constraint: {
                fields: ['"sessaoId"', '"poltronaId"'],
              },
            },
          },
        },
      } as never,
      host,
    );

    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith({
      statusCode: 409,
      message: OCUPACAO_POLTRONA_CONFLICT_MESSAGE,
      error: 'Conflict',
    });
  });

  it('preserva a mensagem genérica para outras violações P2002', () => {
    const filter = new PrismaExceptionFilter();

    filter.catch(
      {
        code: 'P2002',
        meta: { modelName: 'User', target: ['email'] },
      } as never,
      host,
    );

    expect(json).toHaveBeenCalledWith({
      statusCode: 409,
      message: 'Já existe um registro com este valor: email.',
      error: 'Conflict',
    });
  });
});
