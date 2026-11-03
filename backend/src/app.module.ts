import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { SalasModule } from './salas/salas.module';
import { FilmesModule } from './filmes/filmes.module';
import { SessoesModule } from './sessoes/sessoes.module';
import { ProdutosModule } from './produtos/produtos.module';
import { PedidosModule } from './pedidos/pedidos.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [PrismaModule, UsersModule, SalasModule, FilmesModule, SessoesModule, ProdutosModule, PedidosModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
