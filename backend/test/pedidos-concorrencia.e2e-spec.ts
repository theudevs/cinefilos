import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { jest } from '@jest/globals';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import {
  GeneroFilme,
  Profile,
  StatusPedido,
  TipoIngresso,
} from '../src/generated/prisma/enums';
import { OCUPACAO_POLTRONA_CONFLICT_MESSAGE } from '../src/pedidos/ocupacao-poltrona-conflict';
import { PrismaExceptionFilter } from '../src/prisma/prisma-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';

type AuthResponse = { access_token: string };
type PedidoResponse = { id: number; status: StatusPedido };
type ConflictResponse = { statusCode: number; message: string; error: string };
type PoltronaResponse = { id: number; codigo: string; disponivel: boolean };

describe('Pedidos concorrentes (e2e com PostgreSQL isolado)', () => {
  jest.setTimeout(60_000);

  let app: INestApplication<App>;
  let prisma: PrismaService;
  let userToken: string;
  let otherUserToken: string;
  let adminToken: string;
  const runBase = 1_500_000_000 + (Date.now() % 100_000_000);
  let fixtureSequence = 0;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.useGlobalFilters(new PrismaExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    await assertIsolatedDatabase();

    const password = 'e2e-only-password';
    const passwordHash = await bcrypt.hash(password, 4);
    const identity = `${runBase}-${process.pid}`;
    const [user, otherUser, admin] = await Promise.all([
      prisma.user.create({
        data: {
          email: `e2e-user-${identity}@example.invalid`,
          password: passwordHash,
          profile: Profile.USER,
        },
      }),
      prisma.user.create({
        data: {
          email: `e2e-other-${identity}@example.invalid`,
          password: passwordHash,
          profile: Profile.USER,
        },
      }),
      prisma.user.create({
        data: {
          email: `e2e-admin-${identity}@example.invalid`,
          password: passwordHash,
          profile: Profile.ADMIN,
        },
      }),
    ]);

    [userToken, otherUserToken, adminToken] = await Promise.all([
      login(user.email, password),
      login(otherUser.email, password),
      login(admin.email, password),
    ]);
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  async function assertIsolatedDatabase() {
    const databaseUrl = process.env.DATABASE_URL;
    const expectedDatabase = process.env.E2E_DATABASE_NAME;

    if (
      !databaseUrl ||
      !expectedDatabase ||
      process.env.E2E_ALLOW_DATABASE_WRITE !== 'true'
    ) {
      throw new Error(
        'E2E bloqueado: informe DATABASE_URL, E2E_DATABASE_NAME e E2E_ALLOW_DATABASE_WRITE=true.',
      );
    }

    const target = new URL(databaseUrl);
    const targetDatabase = target.pathname.replace(/^\//, '');
    if (
      !['127.0.0.1', 'localhost'].includes(target.hostname) ||
      targetDatabase !== expectedDatabase
    ) {
      throw new Error(
        `E2E bloqueado: destino não isolado (${target.hostname}/${targetDatabase}).`,
      );
    }

    const identity = await prisma.$queryRaw<Array<{ database: string }>>`
      SELECT current_database() AS database
    `;
    if (identity[0]?.database !== expectedDatabase) {
      throw new Error(
        `E2E bloqueado: banco conectado ${identity[0]?.database ?? 'desconhecido'}.`,
      );
    }
  }

  async function login(email: string, password: string) {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);
    return (response.body as AuthResponse).access_token;
  }

  async function createFixture(codes: string[]) {
    fixtureSequence += 1;
    const numero = runBase + fixtureSequence;
    const sala = await prisma.sala.create({
      data: {
        numero,
        linhas: 1,
        colunas: codes.length,
        capacidade: codes.length,
        poltronas: { create: codes.map((codigo) => ({ codigo })) },
      },
      include: { poltronas: { orderBy: { codigo: 'asc' } } },
    });
    const now = Date.now();
    const filme = await prisma.filme.create({
      data: {
        titulo: `E2E concorrência ${numero}`,
        sinopse: 'Fixture isolada para concorrência.',
        classificacao: 'L',
        duracao: 90,
        elenco: 'Teste',
        genero: GeneroFilme.DRAMA,
        dataInicioExibicao: new Date(now - 86_400_000),
        dataFinalExibicao: new Date(now + 30 * 86_400_000),
      },
    });
    const sessao = await prisma.sessao.create({
      data: {
        horarioExibicao: new Date(now + 86_400_000),
        valorInteira: 20,
        valorMeia: 10,
        filmeId: filme.id,
        salaId: sala.id,
      },
    });

    return { sessao, poltronas: sala.poltronas };
  }

  function reserve(
    token: string,
    sessaoId: number,
    poltronaIds: number[],
    paid = false,
  ) {
    return request(app.getHttpServer())
      .post(paid ? '/pedidos/finalizar' : '/pedidos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ingressos: poltronaIds.map((poltronaId) => ({
          sessaoId,
          poltronaId,
          tipo: TipoIngresso.INTEIRA,
        })),
      });
  }

  async function createOpenOrder() {
    const { sessao, poltronas } = await createFixture(['A1']);
    const response = await reserve(userToken, sessao.id, [poltronas[0].id]);
    expect(response.status).toBe(201);
    return {
      pedidoId: (response.body as PedidoResponse).id,
      sessaoId: sessao.id,
      poltronaId: poltronas[0].id,
    };
  }

  it('aceita uma de 20 reservas simultâneas e retorna 409 nas demais', async () => {
    const { sessao, poltronas } = await createFixture(['A1']);
    const pedidosBefore = await prisma.pedido.count();
    const responses = await Promise.all(
      Array.from({ length: 20 }, () =>
        reserve(userToken, sessao.id, [poltronas[0].id]),
      ),
    );

    expect(responses.filter(({ status }) => status === 201)).toHaveLength(1);
    const conflicts = responses.filter(({ status }) => status === 409);
    expect(conflicts).toHaveLength(19);
    expect(conflicts[0].body as ConflictResponse).toEqual({
      statusCode: 409,
      message: OCUPACAO_POLTRONA_CONFLICT_MESSAGE,
      error: 'Conflict',
    });
    await expect(prisma.pedido.count()).resolves.toBe(pedidosBefore + 1);
    await expect(
      prisma.pedido.count({
        where: { ingressos: { some: { sessaoId: sessao.id } } },
      }),
    ).resolves.toBe(1);
    await expect(
      prisma.ocupacaoPoltrona.count({ where: { sessaoId: sessao.id } }),
    ).resolves.toBe(1);

    const availability = await request(app.getHttpServer())
      .get(`/sessoes/${sessao.id}/poltronas`)
      .expect(200);
    expect(availability.body as PoltronaResponse[]).toMatchObject([
      { id: poltronas[0].id, codigo: 'A1', disponivel: false },
    ]);
  });

  it('reverte integralmente carrinhos parcialmente sobrepostos', async () => {
    const { sessao, poltronas } = await createFixture(['A1', 'A2', 'A3']);
    const pedidosBefore = await prisma.pedido.count();
    const responses = await Promise.all([
      reserve(userToken, sessao.id, [poltronas[0].id, poltronas[1].id]),
      reserve(otherUserToken, sessao.id, [poltronas[1].id, poltronas[2].id]),
    ]);

    expect(responses.map(({ status }) => status).sort()).toEqual([201, 409]);
    await expect(prisma.pedido.count()).resolves.toBe(pedidosBefore + 1);
    await expect(
      prisma.pedido.count({
        where: { ingressos: { some: { sessaoId: sessao.id } } },
      }),
    ).resolves.toBe(1);
    await expect(
      prisma.ingresso.count({ where: { sessaoId: sessao.id } }),
    ).resolves.toBe(2);
    await expect(
      prisma.ocupacaoPoltrona.count({ where: { sessaoId: sessao.id } }),
    ).resolves.toBe(2);
  });

  it('permite reservas paralelas de poltronas diferentes', async () => {
    const { sessao, poltronas } = await createFixture(['A1', 'A2', 'A3']);
    const responses = await Promise.all(
      poltronas.map(({ id }) => reserve(userToken, sessao.id, [id])),
    );

    expect(responses.map(({ status }) => status).sort()).toEqual([
      201, 201, 201,
    ]);
    await expect(
      prisma.ocupacaoPoltrona.count({ where: { sessaoId: sessao.id } }),
    ).resolves.toBe(3);
  });

  it('arbitra pagamento contra cancelamento sem sobrescrever o vencedor', async () => {
    const { pedidoId } = await createOpenOrder();
    const responses = await Promise.all([
      request(app.getHttpServer())
        .patch(`/pedidos/${pedidoId}/pagar`)
        .set('Authorization', `Bearer ${userToken}`),
      request(app.getHttpServer())
        .delete(`/pedidos/${pedidoId}`)
        .set('Authorization', `Bearer ${userToken}`),
    ]);

    expect(responses.map(({ status }) => status).sort()).toEqual([200, 409]);
    const pedido = await prisma.pedido.findUniqueOrThrow({
      where: { id: pedidoId },
    });
    const ocupacoes = await prisma.ocupacaoPoltrona.count({
      where: { pedidoId },
    });
    expect([StatusPedido.PAGO, StatusPedido.CANCELADO]).toContain(
      pedido.status,
    );
    expect(ocupacoes).toBe(pedido.status === StatusPedido.PAGO ? 1 : 0);
  });

  it('aceita somente um de dois pagamentos simultâneos', async () => {
    const { pedidoId } = await createOpenOrder();
    const responses = await Promise.all(
      Array.from({ length: 2 }, () =>
        request(app.getHttpServer())
          .patch(`/pedidos/${pedidoId}/pagar`)
          .set('Authorization', `Bearer ${userToken}`),
      ),
    );

    expect(responses.map(({ status }) => status).sort()).toEqual([200, 409]);
    await expect(
      prisma.pedido.findUniqueOrThrow({ where: { id: pedidoId } }),
    ).resolves.toMatchObject({ status: StatusPedido.PAGO });
    await expect(
      prisma.ocupacaoPoltrona.count({ where: { pedidoId } }),
    ).resolves.toBe(1);
  });

  it('aceita somente um de dois cancelamentos e preserva o ingresso', async () => {
    const { pedidoId } = await createOpenOrder();
    const responses = await Promise.all(
      Array.from({ length: 2 }, () =>
        request(app.getHttpServer())
          .delete(`/pedidos/${pedidoId}`)
          .set('Authorization', `Bearer ${userToken}`),
      ),
    );

    expect(responses.map(({ status }) => status).sort()).toEqual([200, 409]);
    await expect(
      prisma.pedido.findUniqueOrThrow({ where: { id: pedidoId } }),
    ).resolves.toMatchObject({ status: StatusPedido.CANCELADO });
    await expect(
      prisma.ocupacaoPoltrona.count({ where: { pedidoId } }),
    ).resolves.toBe(0);
    await expect(prisma.ingresso.count({ where: { pedidoId } })).resolves.toBe(
      1,
    );
  });

  it('libera poltrona cancelada, mantém histórico e bloqueia poltrona paga', async () => {
    const { pedidoId, sessaoId, poltronaId } = await createOpenOrder();
    await request(app.getHttpServer())
      .delete(`/pedidos/${pedidoId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    const replacement = await reserve(
      otherUserToken,
      sessaoId,
      [poltronaId],
      true,
    );
    expect(replacement.status).toBe(201);
    const paidId = (replacement.body as PedidoResponse).id;
    await expect(
      prisma.ingresso.count({ where: { sessaoId, poltronaId } }),
    ).resolves.toBe(2);
    await expect(
      prisma.ocupacaoPoltrona.count({ where: { pedidoId: paidId } }),
    ).resolves.toBe(1);

    const conflict = await reserve(userToken, sessaoId, [poltronaId]);
    expect(conflict.status).toBe(409);
  });

  it('impede terceiros e mantém administradores na mesma matriz de transições', async () => {
    const { pedidoId } = await createOpenOrder();
    await request(app.getHttpServer())
      .patch(`/pedidos/${pedidoId}/pagar`)
      .set('Authorization', `Bearer ${otherUserToken}`)
      .expect(403);
    await request(app.getHttpServer())
      .delete(`/pedidos/${pedidoId}`)
      .set('Authorization', `Bearer ${otherUserToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/pedidos/${pedidoId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: StatusPedido.PAGO })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/pedidos/${pedidoId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: StatusPedido.CANCELADO })
      .expect(409);

    await expect(
      prisma.pedido.findUniqueOrThrow({ where: { id: pedidoId } }),
    ).resolves.toMatchObject({ status: StatusPedido.PAGO });
    await expect(
      prisma.ocupacaoPoltrona.count({ where: { pedidoId } }),
    ).resolves.toBe(1);
  });
});
