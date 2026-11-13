import { jest } from '@jest/globals';
import { PrismaService } from '../prisma/prisma.service';
import { SessoesService } from './sessoes.service';

describe('SessoesService', () => {
  it('calcula disponibilidade exclusivamente pelas ocupações ativas', async () => {
    const sessaoFindUnique = jest.fn().mockResolvedValue({
      id: 1,
      sala: {
        poltronas: [
          { id: 10, codigo: 'A1' },
          { id: 11, codigo: 'A2' },
        ],
      },
    });
    const ocupacaoFindMany = jest.fn().mockResolvedValue([{ poltronaId: 11 }]);
    const ingressoFindMany = jest.fn();
    const prisma = {
      sessao: { findUnique: sessaoFindUnique },
      ingresso: { findMany: ingressoFindMany },
      ocupacaoPoltrona: { findMany: ocupacaoFindMany },
    } as unknown as PrismaService;
    const service = new SessoesService(prisma);

    await expect(service.findPoltronas(1)).resolves.toEqual([
      { id: 10, codigo: 'A1', disponivel: true },
      { id: 11, codigo: 'A2', disponivel: false },
    ]);
    expect(ocupacaoFindMany).toHaveBeenCalledWith({
      where: { sessaoId: 1 },
      select: { poltronaId: true },
    });
    expect(ingressoFindMany).not.toHaveBeenCalled();
  });
});
