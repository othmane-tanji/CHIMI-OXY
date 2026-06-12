import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FournisseursService } from './fournisseurs.service';
import { CreateFournisseurDto } from './dto/create-fournisseur.dto';
import { UpdateFournisseurDto } from './dto/update-fournisseur.dto';

@Controller('fournisseurs')
@UseGuards(JwtAuthGuard)
export class FournisseursController {
  constructor(private fournisseursService: FournisseursService) {}

  @Get()
  findAll(@Query('societe') societe?: string) {
    return this.fournisseursService.findAll(societe);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.fournisseursService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateFournisseurDto) {
    return this.fournisseursService.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFournisseurDto) {
    return this.fournisseursService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.fournisseursService.remove(id);
  }
}
