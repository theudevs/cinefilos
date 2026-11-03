import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, IsPositive } from 'class-validator';

export class FindSessoesQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'Filtrar sessões por filme' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  filmeId?: number;

  @ApiPropertyOptional({
    example: '2026-10-10',
    description: 'Filtrar sessões pelo dia de exibição',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  data?: Date;
}
