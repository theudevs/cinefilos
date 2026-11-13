import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { SalasService } from './salas.service';

describe('SalasService', () => {
  let service: SalasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SalasService, { provide: PrismaService, useValue: {} }],
    }).compile();

    service = module.get<SalasService>(SalasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
