import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { PedidosService } from './pedidos.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Profile, StatusPedido } from '../generated/prisma/enums';

@ApiTags('pedidos')
@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @Post('finalizar')
  @ApiBearerAuth('token')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Criar um pedido já finalizado como pago' })
  @ApiResponse({ status: 201, description: 'Pedido pago criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 409, description: 'Poltrona já vendida.' })
  createPaid(@Body() createPedidoDto: CreatePedidoDto, @Req() request) {
    return this.pedidosService.create(
      createPedidoDto,
      request.user.userId,
      StatusPedido.PAGO,
    );
  }

  @Post()
  @ApiBearerAuth('token')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Criar um novo pedido de compra' })
  @ApiResponse({ status: 201, description: 'Pedido criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 409, description: 'Poltrona já vendida.' })
  create(@Body() createPedidoDto: CreatePedidoDto, @Req() request) {
    return this.pedidosService.create(createPedidoDto, request.user.userId);
  }

  @Get()
  @ApiBearerAuth('token')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Listar pedidos do usuário logado ou todos para admin' })
  findAll(@Req() request, @Query('filmeId') filmeId?: string) {
    return this.pedidosService.findAll(request.user, filmeId ? +filmeId : undefined);
  }

  @Get(':id')
  @ApiBearerAuth('token')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Profile.ADMIN)
  @ApiOperation({ summary: 'Buscar um pedido pelo ID' })
  findOne(@Param('id') id: string) {
    return this.pedidosService.findOne(+id);
  }

  @Patch(':id/pagar')
  @ApiBearerAuth('token')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Finalizar pagamento de um pedido aberto' })
  pay(@Param('id') id: string, @Req() request) {
    return this.pedidosService.pay(+id, request.user);
  }

  @Patch(':id')
  @ApiBearerAuth('token')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Profile.ADMIN)
  @ApiOperation({ summary: 'Atualizar o status de um pedido' })
  update(@Param('id') id: string, @Body() updatePedidoDto: UpdatePedidoDto) {
    return this.pedidosService.update(+id, updatePedidoDto);
  }

  @Delete(':id')
  @ApiBearerAuth('token')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Cancelar um pedido' })
  remove(@Param('id') id: string, @Req() request) {
    return this.pedidosService.remove(+id, request.user);
  }
}
