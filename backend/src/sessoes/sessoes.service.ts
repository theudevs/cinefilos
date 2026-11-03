import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessoeDto } from './dto/create-sessoe.dto';
import { FindSessoesQueryDto } from './dto/find-sessoes-query.dto';
import { UpdateSessoeDto } from './dto/update-sessoe.dto';

@Injectable()
export class SessoesService {
  constructor(private prisma: PrismaService) {}

  private readonly includeRelations = {
    filme: true,
    sala: true,
  };

  create(createSessoeDto: CreateSessoeDto) {
    this.validateHorarioExibicao(createSessoeDto.horarioExibicao);

    return this.validateSalaDisponivel(createSessoeDto).then(() =>
      this.prisma.sessao.create({
        data: createSessoeDto,
        include: this.includeRelations,
      }),
    );
  }

  findAll(query: FindSessoesQueryDto = {}) {
    const dataInicio = query.data ? this.startOfDay(query.data) : undefined;
    const dataFim = query.data ? this.endOfDay(query.data) : undefined;

    return this.prisma.sessao.findMany({
      where: {
        filmeId: query.filmeId,
        horarioExibicao:
          dataInicio && dataFim
            ? {
                gte: dataInicio,
                lte: dataFim,
              }
            : undefined,
      },
      include: this.includeRelations,
      orderBy: { horarioExibicao: 'asc' },
    });
  }

  findOne(id: number) {
    return this.prisma.sessao.findUniqueOrThrow({
      where: { id },
      include: this.includeRelations,
    });
  }

  async findPoltronas(id: number) {
    const sessao = await this.prisma.sessao.findUnique({
      where: { id },
      include: {
        sala: {
          include: {
            poltronas: {
              orderBy: { codigo: 'asc' },
            },
          },
        },
      },
    });

    if (!sessao) {
      throw new NotFoundException('Sessão informada não existe.');
    }

    const ingressosAtivos = await this.prisma.ingresso.findMany({
      where: {
        sessaoId: id,
        pedido: {
          status: {
            not: 'CANCELADO',
          },
        },
      },
      select: { poltronaId: true },
    });

    const poltronasOcupadas = new Set(
      ingressosAtivos.map((ingresso) => ingresso.poltronaId),
    );

    return sessao.sala.poltronas.map((poltrona) => ({
      ...poltrona,
      disponivel: !poltronasOcupadas.has(poltrona.id),
    }));
  }

  update(id: number, updateSessoeDto: UpdateSessoeDto) {
    if (updateSessoeDto.horarioExibicao) {
      this.validateHorarioExibicao(updateSessoeDto.horarioExibicao);
    }

    return this.validateSalaDisponivel(updateSessoeDto, id).then(() =>
      this.prisma.sessao.update({
        where: { id },
        data: updateSessoeDto,
        include: this.includeRelations,
      }),
    );
  }

  async remove(id: number) {
    const ingressosVendidos = await this.prisma.ingresso.count({
      where: { sessaoId: id },
    });

    if (ingressosVendidos > 0) {
      throw new BadRequestException(
        'Não é possível remover uma sessão que já possui ingressos vendidos.',
      );
    }

    return this.prisma.sessao.delete({ where: { id } });
  }

  private validateHorarioExibicao(horarioExibicao: Date) {
    if (horarioExibicao < new Date()) {
      throw new BadRequestException('A data da sessão não pode ser retroativa.');
    }
  }

  private async validateSalaDisponivel(
    data: CreateSessoeDto | UpdateSessoeDto,
    sessaoId?: number,
  ) {
    if (!data.horarioExibicao && !data.filmeId && !data.salaId) {
      return;
    }

    const sessaoAtual = sessaoId
      ? await this.prisma.sessao.findUnique({
          where: { id: sessaoId },
          include: { filme: true },
        })
      : null;

    const horarioExibicao = data.horarioExibicao ?? sessaoAtual?.horarioExibicao;
    const filmeId = data.filmeId ?? sessaoAtual?.filmeId;
    const salaId = data.salaId ?? sessaoAtual?.salaId;

    if (!horarioExibicao || !filmeId || !salaId) {
      return;
    }

    const filme = await this.prisma.filme.findUnique({ where: { id: filmeId } });

    if (!filme) {
      throw new BadRequestException('Filme informado não existe.');
    }

    const novaSessaoInicio = horarioExibicao;
    const novaSessaoFim = this.addMinutes(novaSessaoInicio, filme.duracao);

    const sessoesDaSala = await this.prisma.sessao.findMany({
      where: {
        salaId,
        NOT: sessaoId ? { id: sessaoId } : undefined,
      },
      include: { filme: true },
    });

    const hasConflito = sessoesDaSala.some((sessao) => {
      const inicio = sessao.horarioExibicao;
      const fim = this.addMinutes(inicio, sessao.filme.duracao);

      return novaSessaoInicio < fim && novaSessaoFim > inicio;
    });

    if (hasConflito) {
      throw new BadRequestException(
        'A sala já possui uma sessão cadastrada nesse intervalo de horário.',
      );
    }
  }

  private addMinutes(date: Date, minutes: number) {
    return new Date(date.getTime() + minutes * 60 * 1000);
  }

  private startOfDay(date: Date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  private endOfDay(date: Date) {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return end;
  }
}
