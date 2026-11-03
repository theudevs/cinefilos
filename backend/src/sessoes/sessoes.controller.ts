import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SessoesService } from './sessoes.service';
import { CreateSessoeDto } from './dto/create-sessoe.dto';
import { UpdateSessoeDto } from './dto/update-sessoe.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FindSessoesQueryDto } from './dto/find-sessoes-query.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Profile } from '../generated/prisma/enums';

@ApiTags('sessoes')
@Controller('sessoes')
export class SessoesController {
  constructor(private readonly sessoesService: SessoesService) {}

  @Post()
  @ApiBearerAuth('token')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Profile.ADMIN)
  @ApiOperation({ summary: 'Criar uma nova sessão' })
  @ApiResponse({ status: 201, description: 'Sessão criada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  create(@Body() createSessoeDto: CreateSessoeDto) {
    return this.sessoesService.create(createSessoeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as sessões' })
  findAll(@Query() query: FindSessoesQueryDto) {
    return this.sessoesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar uma sessão pelo ID' })
  findOne(@Param('id') id: string) {
    return this.sessoesService.findOne(+id);
  }

  @Get(':id/poltronas')
  @ApiOperation({ summary: 'Listar poltronas disponíveis e ocupadas da sessão' })
  findPoltronas(@Param('id') id: string) {
    return this.sessoesService.findPoltronas(+id);
  }

  @Patch(':id')
  @ApiBearerAuth('token')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Profile.ADMIN)
  @ApiOperation({ summary: 'Atualizar uma sessão' })
  update(@Param('id') id: string, @Body() updateSessoeDto: UpdateSessoeDto) {
    return this.sessoesService.update(+id, updateSessoeDto);
  }

  @Delete(':id')
  @ApiBearerAuth('token')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Profile.ADMIN)
  @ApiOperation({ summary: 'Remover uma sessão' })
  remove(@Param('id') id: string) {
    return this.sessoesService.remove(+id);
  }
}
