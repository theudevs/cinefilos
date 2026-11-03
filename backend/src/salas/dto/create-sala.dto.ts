import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class CreateSalaDto {
  @ApiProperty({ example: 1, description: 'Número da sala' })
  @IsInt()
  @IsPositive()
  numero: number;

  @ApiProperty({ example: 8, description: 'Quantidade de linhas da sala' })
  @IsInt()
  @IsPositive()
  linhas: number;

  @ApiProperty({ example: 10, description: 'Quantidade de colunas por linha' })
  @IsInt()
  @IsPositive()
  colunas: number;
}
