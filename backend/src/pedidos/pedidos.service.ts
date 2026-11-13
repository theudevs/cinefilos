import {
  BadRequestException,
  ConflictException,
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
import {
  isOcupacaoPoltronaUniqueConflict,
  OCUPACAO_POLTRONA_CONFLICT_MESSAGE,
} from './ocupacao-poltrona-conflict';

type OcupacaoPoltronaDelegate = {
  create(args: {
    data: { pedidoId: number; sessaoId: number; poltronaId: number };
  }): Promise<unknown>;
  deleteMany(args: { where: { pedidoId: number } }): Promise<{ count: number }>;
};

type PrismaWithOcupacaoPoltrona = {
  ocupacaoPoltrona: OcupacaoPoltronaDelegate;
};

type AuthenticatedUser = { userId: number; profile: string };

@Injectable()
export class PedidosService {
  constructor(private prisma: PrismaService) {}

  private readonly includeRelations = {
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

    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Usuário informado não existe.');
    }

    this.validatePoltronasDuplicadas(createPedidoDto.ingressos);

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
    const ocupacoes = ingressos
      .map(({ sessaoId, poltronaId }) => ({ sessaoId, poltronaId }))
      .sort(
        (first, second) =>
          first.sessaoId - second.sessaoId ||
          first.poltronaId - second.poltronaId,
      );

    try {
      return await this.prisma.$transaction(async (prisma) => {
        const pedido = await prisma.pedido.create({
          data: {
            userId,
            status,
            valorTotal,
            metodoPagamento: createPedidoDto.metodoPagamento,
          },
        });
        const ocupacaoPoltrona = this.getOcupacaoPoltronaDelegate(prisma);

        // A ordem determinística de aquisição das chaves reduz o risco de
        // deadlock quando carrinhos se sobrepõem parcialmente.
        for (const ocupacao of ocupacoes) {
          await ocupacaoPoltrona.create({
            data: { pedidoId: pedido.id, ...ocupacao },
          });
        }

        await prisma.ingresso.createMany({
          data: ingressos.map((ingresso) => ({
            pedidoId: pedido.id,
            ...ingresso,
          })),
        });

        if (produtos.length > 0) {
          await prisma.pedidoProduto.createMany({
            data: produtos.map((produto) => ({
              pedidoId: pedido.id,
              ...produto,
            })),
          });
        }

        return prisma.pedido.findUniqueOrThrow({
          where: { id: pedido.id },
          include: this.includeRelations,
        });
      });
    } catch (error) {
      if (isOcupacaoPoltronaUniqueConflict(error)) {
        throw new ConflictException(OCUPACAO_POLTRONA_CONFLICT_MESSAGE);
      }

      throw error;
    }
  }

  findAll(user?: AuthenticatedUser, filmeId?: number) {
    return this.prisma.pedido.findMany({
      where: {
        userId: user?.profile === 'ADMIN' ? undefined : user?.userId,
        ingressos: filmeId ? { some: { sessao: { filmeId } } } : undefined,
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
    if (!updatePedidoDto.status) {
      return this.findOne(id);
    }

    return this.transitionStatus(
      id,
      updatePedidoDto.status,
      { userId: 0, profile: 'ADMIN' },
      'Você não pode alterar este pedido.',
    );
  }

  pay(id: number, user?: AuthenticatedUser) {
    return this.transitionStatus(
      id,
      StatusPedido.PAGO,
      user,
      'Você não pode finalizar este pedido.',
    );
  }

  remove(id: number, user?: AuthenticatedUser) {
    return this.transitionStatus(
      id,
      StatusPedido.CANCELADO,
      user,
      'Você não pode cancelar este pedido.',
    );
  }

  private async transitionStatus(
    id: number,
    destination: StatusPedido,
    user: AuthenticatedUser | undefined,
    forbiddenMessage: string,
  ) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!pedido) {
      throw new NotFoundException('Pedido não encontrado.');
    }

    if (user?.profile !== 'ADMIN' && pedido.userId !== user?.userId) {
      throw new ForbiddenException(forbiddenMessage);
    }

    if (
      destination !== StatusPedido.PAGO &&
      destination !== StatusPedido.CANCELADO
    ) {
      throw new ConflictException(
        'A transição solicitada não é permitida para o pedido.',
      );
    }

    return this.prisma.$transaction(async (prisma) => {
      const transition = await prisma.pedido.updateMany({
        where: { id, status: StatusPedido.ABERTO },
        data: { status: destination },
      });

      if (transition.count !== 1) {
        throw new ConflictException(
          'O pedido não está mais em aberto. Recarregue os dados e tente novamente.',
        );
      }

      if (destination === StatusPedido.CANCELADO) {
        await this.getOcupacaoPoltronaDelegate(prisma).deleteMany({
          where: { pedidoId: id },
        });
      }

      return prisma.pedido.findUniqueOrThrow({
        where: { id },
        include: this.includeRelations,
      });
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

  private getOcupacaoPoltronaDelegate(client: unknown) {
    return (client as PrismaWithOcupacaoPoltrona).ocupacaoPoltrona;
  }
}
