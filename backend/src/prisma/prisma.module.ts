import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
@Module({
    providers: [PrismaService],
    exports: [PrismaService], // exportar o PrismaService para outros módulos
})
export class PrismaModule { }
