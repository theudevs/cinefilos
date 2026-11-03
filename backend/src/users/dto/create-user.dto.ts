import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'usuario@email.com', description: 'Email do usuário' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'João Silva', description: 'Nome completo do usuário' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'senha123',
    description: 'Senha com no mínimo 6 caracteres',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;

}
