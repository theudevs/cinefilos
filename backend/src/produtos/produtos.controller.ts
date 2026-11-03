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
import { ProdutosService } from './produtos.service';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Profile } from '../generated/prisma/enums';

@ApiTags('produtos')
@Controller('produtos')
export class ProdutosController {
  constructor(private readonly produtosService: ProdutosService) {}

  @Post()
  @ApiBearerAuth('token')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Profile.ADMIN)
  @ApiOperation({ summary: 'Criar um novo produto' })
  @ApiResponse({ status: 201, description: 'Produto criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  create(@Body() createProdutoDto: CreateProdutoDto) {
    return this.produtosService.create(createProdutoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os produtos' })
  findAll() {
    return this.produtosService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar um produto pelo ID' })
  findOne(@Param('id') id: string) {
    return this.produtosService.findOne(+id);
  }

  @Patch(':id')
  @ApiBearerAuth('token')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Profile.ADMIN)
  @ApiOperation({ summary: 'Atualizar um produto' })
  update(@Param('id') id: string, @Body() updateProdutoDto: UpdateProdutoDto) {
    return this.produtosService.update(+id, updateProdutoDto);
  }

  @Delete(':id')
  @ApiBearerAuth('token')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Profile.ADMIN)
  @ApiOperation({ summary: 'Remover um produto' })
  remove(@Param('id') id: string) {
    return this.produtosService.remove(+id);
  }
}
