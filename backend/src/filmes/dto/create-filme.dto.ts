import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  MinLength,
} from 'class-validator';
import { GeneroFilme } from '../../generated/prisma/enums';

export class CreateFilmeDto {
  @ApiProperty({ example: 'Interestelar', description: 'Título do filme' })
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @ApiProperty({
    example: 'Uma equipe viaja através de um buraco de minhoca em busca de um novo lar.',
    description: 'Sinopse do filme',
    minLength: 10,
  })
  @IsString()
  @MinLength(10)
  sinopse: string;

  @ApiProperty({ example: '12 anos', description: 'Classificação indicativa' })
  @IsString()
  @IsNotEmpty()
  classificacao: string;

  @ApiProperty({ example: 169, description: 'Duração do filme em minutos' })
  @IsInt()
  @IsPositive()
  duracao: number;

  @ApiProperty({
    example: 'Matthew McConaughey, Anne Hathaway, Jessica Chastain',
    description: 'Elenco principal',
  })
  @IsString()
  @IsNotEmpty()
  elenco: string;

  @ApiProperty({
    enum: GeneroFilme,
    example: GeneroFilme.DRAMA,
    description: 'Gênero do filme',
  })
  @IsEnum(GeneroFilme)
  genero: GeneroFilme;

  @ApiProperty({
    example: 'https://exemplo.com/cartazes/interestelar.jpg',
    description: 'URL da imagem do cartaz do filme',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  cartazUrl?: string;

  @ApiProperty({
    example: '2026-10-04T00:00:00.000Z',
    description: 'Data de início da exibição',
  })
  @Type(() => Date)
  @IsDate()
  dataInicioExibicao: Date;

  @ApiProperty({
    example: '2026-11-04T00:00:00.000Z',
    description: 'Data final da exibição',
  })
  @Type(() => Date)
  @IsDate()
  dataFinalExibicao: Date;
}
