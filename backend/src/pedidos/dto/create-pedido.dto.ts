import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  ValidateNested,
} from 'class-validator';
import { MetodoPagamento, TipoIngresso } from '../../generated/prisma/enums';

export class CreatePedidoIngressoDto {
  @ApiProperty({ example: 1, description: 'ID da sessão escolhida' })
  @IsInt()
  @IsPositive()
  sessaoId: number;

  @ApiProperty({ example: 1, description: 'ID da poltrona escolhida' })
  @IsInt()
  @IsPositive()
  poltronaId: number;

  @ApiProperty({
    enum: TipoIngresso,
    example: TipoIngresso.INTEIRA,
    description: 'Tipo do ingresso',
  })
  @IsEnum(TipoIngresso)
  tipo: TipoIngresso;
}

export class CreatePedidoProdutoDto {
  @ApiProperty({ example: 1, description: 'ID do produto escolhido' })
  @IsInt()
  @IsPositive()
  produtoId: number;

  @ApiProperty({ example: 2, description: 'Quantidade do produto' })
  @IsInt()
  @IsPositive()
  quantidade: number;
}

export class CreatePedidoDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'ID do usuário comprador. Em rotas autenticadas, vem do token.',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  userId?: number;

  @ApiPropertyOptional({
    enum: MetodoPagamento,
    example: MetodoPagamento.PIX,
    description: 'Método de pagamento escolhido pelo comprador',
  })
  @IsOptional()
  @IsEnum(MetodoPagamento)
  metodoPagamento?: MetodoPagamento;

  @ApiProperty({
    type: [CreatePedidoIngressoDto],
    description: 'Ingressos selecionados para o pedido',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePedidoIngressoDto)
  ingressos: CreatePedidoIngressoDto[];

  @ApiPropertyOptional({
    type: [CreatePedidoProdutoDto],
    description: 'Produtos selecionados para o pedido',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePedidoProdutoDto)
  produtos?: CreatePedidoProdutoDto[];
}
