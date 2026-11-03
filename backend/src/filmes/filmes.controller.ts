import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { FilmesService } from './filmes.service';
import { CreateFilmeDto } from './dto/create-filme.dto';
import { UpdateFilmeDto } from './dto/update-filme.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Profile } from '../generated/prisma/enums';

@ApiTags('filmes')
@Controller('filmes')
export class FilmesController {
  constructor(private readonly filmesService: FilmesService) {}

  @Post()
  @ApiBearerAuth('token')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Profile.ADMIN)
  @ApiOperation({ summary: 'Criar um novo filme' })
  @ApiResponse({ status: 201, description: 'Filme criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  create(@Body() createFilmeDto: CreateFilmeDto) {
    return this.filmesService.create(createFilmeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os filmes' })
  findAll() {
    return this.filmesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar um filme pelo ID' })
  findOne(@Param('id') id: string) {
    return this.filmesService.findOne(+id);
  }

  @Patch(':id')
  @ApiBearerAuth('token')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Profile.ADMIN)
  @ApiOperation({ summary: 'Atualizar um filme' })
  update(@Param('id') id: string, @Body() updateFilmeDto: UpdateFilmeDto) {
    return this.filmesService.update(+id, updateFilmeDto);
  }

  @Delete(':id')
  @ApiBearerAuth('token')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Profile.ADMIN)
  @ApiOperation({ summary: 'Remover um filme' })
  remove(@Param('id') id: string) {
    return this.filmesService.remove(+id);
  }
}
