import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePedidoDto,
  CreatePedidoIngressoDto,
  CreatePedidoProdutoDto,
} from './dto/create-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { StatusPedido, TipoIngresso } from '../generated/prisma/enums';

@Injectable()
export class PedidosService {
  constructor(private prisma: PrismaService) {}

  private readonly includeRelations = {
    user: true,
    ingressos: {
      include: {
        sessao: { include: { filme: true, sala: true } },
        poltrona: true,
      },
    },
    produtos: {
      include: {
        produto: true,
      },
    },
  };

  async create(
    createPedidoDto: CreatePedidoDto,
    authenticatedUserId?: number,
    status: StatusPedido = StatusPedido.ABERTO,
  ) {
    const userId = authenticatedUserId ?? createPedidoDto.userId;

    if (!userId) {
      throw new BadRequestException('Usuário comprador não informado.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário informado não existe.');
    }

    this.validatePoltronasDuplicadas(createPedidoDto.ingressos);
    await this.validatePoltronasDisponiveis(createPedidoDto.ingressos);

    const ingressos = await Promise.all(
      createPedidoDto.ingressos.map((ingresso) =>
        this.buildIngressoData(ingresso),
      ),
    );

    const produtos = await Promise.all(
      (createPedidoDto.produtos ?? []).map((produto) =>
        this.buildProdutoData(produto),
      ),
    );

    const valorTotal = [
      ...ingressos.map((ingresso) => ingresso.valor),
      ...produtos.map((produto) => produto.subtotal),
    ].reduce((total, valor) => total + valor, 0);

    return this.prisma.$transaction((prisma) =>
      prisma.pedido.create({
        data: {
          userId,
          status,
          valorTotal,
          metodoPagamento: createPedidoDto.metodoPagamento,
          ingressos: { create: ingressos },
          produtos: { create: produtos },
        },
        include: this.includeRelations,
      }),
    );
  }

  findAll(user?: { userId: number; profile: string }, filmeId?: number) {
    return this.prisma.pedido.findMany({
      where: {
        userId: user?.profile === 'ADMIN' ? undefined : user?.userId,
        ingressos: filmeId
          ? {
              some: {
                sessao: {
                  filmeId,
                },
              },
            }
          : undefined,
      },
      include: this.includeRelations,
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: number) {
    return this.prisma.pedido.findUniqueOrThrow({
      where: { id },
      include: this.includeRelations,
    });
  }

  update(id: number, updatePedidoDto: UpdatePedidoDto) {
    return this.prisma.pedido.update({
      where: { id },
      data: updatePedidoDto,
      include: this.includeRelations,
    });
  }

  async pay(id: number, user?: { userId: number; profile: string }) {
    const pedido = await this.prisma.pedido.findUniqueOrThrow({
      where: { id },
      select: { userId: true, status: true },
    });

    if (user?.profile !== 'ADMIN' && pedido.userId !== user?.userId) {
      throw new ForbiddenException('Você não pode finalizar este pedido.');
    }

    if (pedido.status === 'CANCELADO') {
      throw new BadRequestException('Não é possível pagar um pedido cancelado.');
    }

    return this.prisma.pedido.update({
      where: { id },
      data: { status: 'PAGO' },
      include: this.includeRelations,
    });
  }

  async remove(id: number, user?: { userId: number; profile: string }) {
    const pedido = await this.prisma.pedido.findUniqueOrThrow({
      where: { id },
      select: { userId: true, status: true },
    });

    if (user?.profile !== 'ADMIN' && pedido.userId !== user?.userId) {
      throw new ForbiddenException('Você não pode cancelar este pedido.');
    }

    if (pedido.status !== 'ABERTO') {
      throw new BadRequestException('Apenas pedidos em aberto podem ser cancelados.');
    }

    return this.prisma.pedido.update({
      where: { id },
      data: { status: 'CANCELADO' },
      include: this.includeRelations,
    });
  }

  private async buildIngressoData(ingresso: CreatePedidoIngressoDto) {
    const sessao = await this.prisma.sessao.findUnique({
      where: { id: ingresso.sessaoId },
    });

    if (!sessao) {
      throw new NotFoundException('Sessão informada não existe.');
    }

    const poltrona = await this.prisma.poltrona.findUnique({
      where: { id: ingresso.poltronaId },
    });

    if (!poltrona) {
      throw new NotFoundException('Poltrona informada não existe.');
    }

    if (poltrona.salaId !== sessao.salaId) {
      throw new BadRequestException(
        'A poltrona selecionada não pertence à sala da sessão.',
      );
    }

    const valor =
      ingresso.tipo === TipoIngresso.INTEIRA
        ? Number(sessao.valorInteira)
        : Number(sessao.valorMeia);

    return {
      sessaoId: ingresso.sessaoId,
      poltronaId: ingresso.poltronaId,
      tipo: ingresso.tipo,
      valor,
    };
  }

  private async buildProdutoData(produtoPedido: CreatePedidoProdutoDto) {
    const produto = await this.prisma.produto.findUnique({
      where: { id: produtoPedido.produtoId },
    });

    if (!produto) {
      throw new NotFoundException('Produto informado não existe.');
    }

    if (!produto.ativo) {
      throw new BadRequestException('Produto informado não está ativo.');
    }

    const valorUnitario = Number(produto.valorUnitario);
    const subtotal = valorUnitario * produtoPedido.quantidade;

    return {
      produtoId: produtoPedido.produtoId,
      quantidade: produtoPedido.quantidade,
      valorUnitario,
      subtotal,
    };
  }

  private validatePoltronasDuplicadas(ingressos: CreatePedidoIngressoDto[]) {
    const poltronasPorSessao = new Set<string>();

    ingressos.forEach((ingresso) => {
      const key = `${ingresso.sessaoId}:${ingresso.poltronaId}`;

      if (poltronasPorSessao.has(key)) {
        throw new BadRequestException(
          'A mesma poltrona foi selecionada mais de uma vez.',
        );
      }

      poltronasPorSessao.add(key);
    });
  }

  private async validatePoltronasDisponiveis(
    ingressos: CreatePedidoIngressoDto[],
  ) {
    const ingressosIndisponiveis = await this.prisma.ingresso.findMany({
      where: {
        OR: ingressos.map((ingresso) => ({
          sessaoId: ingresso.sessaoId,
          poltronaId: ingresso.poltronaId,
        })),
        pedido: {
          status: {
            not: 'CANCELADO',
          },
        },
      },
      include: { poltrona: true },
    });

    if (ingressosIndisponiveis.length > 0) {
      const poltronas = ingressosIndisponiveis
        .map((ingresso) => ingresso.poltrona.codigo)
        .join(', ');

      throw new BadRequestException(
        `As seguintes poltronas já estão ocupadas: ${poltronas}.`,
      );
    }
  }
}
