import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsInt, IsNumber, IsPositive } from 'class-validator';

export class CreateSessoeDto {
  @ApiProperty({
    example: '2026-10-10T20:30:00.000Z',
    description: 'Data e horário de exibição da sessão',
  })
  @Type(() => Date)
  @IsDate()
  horarioExibicao: Date;

  @ApiProperty({ example: 32.5, description: 'Valor do ingresso inteiro' })
  @IsNumber()
  @IsPositive()
  valorInteira: number;

  @ApiProperty({ example: 16.25, description: 'Valor do ingresso meia entrada' })
  @IsNumber()
  @IsPositive()
  valorMeia: number;

  @ApiProperty({ example: 1, description: 'ID do filme exibido na sessão' })
  @IsInt()
  @IsPositive()
  filmeId: number;

  @ApiProperty({ example: 1, description: 'ID da sala onde a sessão ocorrerá' })
  @IsInt()
  @IsPositive()
  salaId: number;
}
