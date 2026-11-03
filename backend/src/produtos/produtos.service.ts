import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';

@Injectable()
export class ProdutosService {
  constructor(private prisma: PrismaService) {}

  create(createProdutoDto: CreateProdutoDto) {
    return this.prisma.produto.create({ data: createProdutoDto });
  }

  findAll() {
    return this.prisma.produto.findMany({
      orderBy: { nome: 'asc' },
    });
  }

  findOne(id: number) {
    return this.prisma.produto.findUniqueOrThrow({ where: { id } });
  }

  update(id: number, updateProdutoDto: UpdateProdutoDto) {
    return this.prisma.produto.update({
      where: { id },
      data: updateProdutoDto,
    });
  }

  async remove(id: number) {
    const pedidosComProduto = await this.prisma.pedidoProduto.count({
      where: { produtoId: id },
    });

    if (pedidosComProduto > 0) {
      return this.prisma.produto.update({
        where: { id },
        data: { ativo: false },
      });
    }

    return this.prisma.produto.delete({ where: { id } });
  }
}
