import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { StatusPedido } from '../../generated/prisma/enums';

export class UpdatePedidoDto {
  @ApiPropertyOptional({
    enum: StatusPedido,
    example: StatusPedido.PAGO,
    description: 'Status do pedido',
  })
  @IsOptional()
  @IsEnum(StatusPedido)
  status?: StatusPedido;
}
