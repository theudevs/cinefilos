import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSalaDto } from './dto/create-sala.dto';
import { UpdateSalaDto } from './dto/update-sala.dto';

@Injectable()
export class SalasService {
  constructor(private prisma: PrismaService) {}

  create(createSalaDto: CreateSalaDto) {
    const capacidade = createSalaDto.linhas * createSalaDto.colunas;

    return this.prisma.sala.create({
      data: {
        ...createSalaDto,
        capacidade,
        poltronas: {
          create: this.generatePoltronas(
            createSalaDto.linhas,
            createSalaDto.colunas,
          ),
        },
      },
      include: { poltronas: true },
    });
  }

  findAll() {
    return this.prisma.sala.findMany({
      include: { poltronas: true },
      orderBy: { numero: 'asc' },
    });
  }

  findOne(id: number) {
    return this.prisma.sala.findUniqueOrThrow({
      where: { id },
      include: { poltronas: true },
    });
  }

  update(id: number, updateSalaDto: UpdateSalaDto) {
    if (updateSalaDto.linhas || updateSalaDto.colunas) {
      throw new BadRequestException(
        'Não é possível alterar a matriz de uma sala já criada.',
      );
    }

    return this.prisma.sala.update({
      where: { id },
      data: updateSalaDto,
    });
  }

  async remove(id: number) {
    const sessoes = await this.prisma.sessao.count({
      where: { salaId: id },
    });

    if (sessoes > 0) {
      throw new BadRequestException(
        'Não é possível remover uma sala que já possui sessões cadastradas.',
      );
    }

    return this.prisma.sala.delete({ where: { id } });
  }

  private generatePoltronas(linhas: number, colunas: number) {
    return Array.from({ length: linhas * colunas }, (_, index) => ({
      codigo: `${this.getRowLabel(Math.floor(index / colunas))}${(index % colunas) + 1}`,
    }));
  }

  private getRowLabel(index: number) {
    let label = '';
    let current = index;

    do {
      label = String.fromCharCode(65 + (current % 26)) + label;
      current = Math.floor(current / 26) - 1;
    } while (current >= 0);

    return label;
  }
}
