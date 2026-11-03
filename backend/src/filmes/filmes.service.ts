import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFilmeDto } from './dto/create-filme.dto';
import { UpdateFilmeDto } from './dto/update-filme.dto';

@Injectable()
export class FilmesService {
  constructor(private prisma: PrismaService) {}

  create(createFilmeDto: CreateFilmeDto) {
    return this.prisma.filme.create({ data: createFilmeDto });
  }

  findAll() {
    return this.prisma.filme.findMany({
      orderBy: { titulo: 'asc' },
    });
  }

  findOne(id: number) {
    return this.prisma.filme.findUniqueOrThrow({ where: { id } });
  }

  update(id: number, updateFilmeDto: UpdateFilmeDto) {
    return this.prisma.filme.update({
      where: { id },
      data: updateFilmeDto,
    });
  }

  async remove(id: number) {
    const sessoes = await this.prisma.sessao.count({
      where: { filmeId: id },
    });

    if (sessoes > 0) {
      throw new BadRequestException(
        'Não é possível remover um filme que já possui sessões cadastradas.',
      );
    }

    return this.prisma.filme.delete({ where: { id } });
  }
}
