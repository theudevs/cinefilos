import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  MinLength,
} from 'class-validator';
import { TipoProduto } from '../../generated/prisma/enums';

export class CreateProdutoDto {
  @ApiProperty({ example: 'Combo Pipoca Grande', description: 'Nome do produto' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({
    example: 'Pipoca grande com refrigerante',
    description: 'Descrição do produto',
    minLength: 3,
  })
  @IsString()
  @MinLength(3)
  descricao: string;

  @ApiProperty({
    enum: TipoProduto,
    example: TipoProduto.COMBO,
    description: 'Tipo do produto vendido',
  })
  @IsEnum(TipoProduto)
  tipo: TipoProduto;

  @ApiPropertyOptional({
    example: 'https://exemplo.com/produtos/combo-pipoca.jpg',
    description: 'URL da imagem do produto',
  })
  @IsOptional()
  @IsUrl()
  imagemUrl?: string;

  @ApiProperty({ example: 35.9, description: 'Valor unitário do produto' })
  @IsNumber()
  @IsPositive()
  valorUnitario: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Indica se o produto está disponível para venda',
  })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
