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
import { SalasService } from './salas.service';
import { CreateSalaDto } from './dto/create-sala.dto';
import { UpdateSalaDto } from './dto/update-sala.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Profile } from '../generated/prisma/enums';

@ApiTags('salas')
@Controller('salas')
export class SalasController {
  constructor(private readonly salasService: SalasService) {}

  @Post()
  @ApiBearerAuth('token')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Profile.ADMIN)
  @ApiOperation({ summary: 'Criar uma nova sala' })
  @ApiResponse({ status: 201, description: 'Sala criada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  create(@Body() createSalaDto: CreateSalaDto) {
    return this.salasService.create(createSalaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as salas' })
  findAll() {
    return this.salasService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar uma sala pelo ID' })
  findOne(@Param('id') id: string) {
    return this.salasService.findOne(+id);
  }

  @Patch(':id')
  @ApiBearerAuth('token')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Profile.ADMIN)
  @ApiOperation({ summary: 'Atualizar uma sala' })
  update(@Param('id') id: string, @Body() updateSalaDto: UpdateSalaDto) {
    return this.salasService.update(+id, updateSalaDto);
  }

  @Delete(':id')
  @ApiBearerAuth('token')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Profile.ADMIN)
  @ApiOperation({ summary: 'Remover uma sala' })
  remove(@Param('id') id: string) {
    return this.salasService.remove(+id);
  }
}
