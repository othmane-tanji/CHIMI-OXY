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
import { TraitesService } from './traites.service';
import {
  CreateDecaissementDto,
  CreateEncaissementDto,
} from './dto/create-traite.dto';
import { UpdateTraiteDto } from './dto/update-traite.dto';

@Controller('traites')
@UseGuards(JwtAuthGuard)
export class TraitesController {
  constructor(private traitesService: TraitesService) {}

  @Get('encaissement')
  findAllEncaissements(
    @Query('search') search?: string,
    @Query('dateDebut') dateDebut?: string,
    @Query('dateFin') dateFin?: string,
  ) {
    return this.traitesService.findAllEncaissements({ search, dateDebut, dateFin });
  }

  @Post('encaissement')
  createEncaissement(@Body() dto: CreateEncaissementDto) {
    return this.traitesService.createEncaissement(dto);
  }

  @Put('encaissement/:id')
  updateEncaissement(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTraiteDto) {
    return this.traitesService.updateEncaissement(id, dto);
  }

  @Delete('encaissement/:id')
  removeEncaissement(@Param('id', ParseIntPipe) id: number) {
    return this.traitesService.removeEncaissement(id);
  }

  @Get('decaissement')
  findAllDecaissements(
    @Query('search') search?: string,
    @Query('dateDebut') dateDebut?: string,
    @Query('dateFin') dateFin?: string,
  ) {
    return this.traitesService.findAllDecaissements({ search, dateDebut, dateFin });
  }

  @Post('decaissement')
  createDecaissement(@Body() dto: CreateDecaissementDto) {
    return this.traitesService.createDecaissement(dto);
  }

  @Put('decaissement/:id')
  updateDecaissement(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTraiteDto) {
    return this.traitesService.updateDecaissement(id, dto);
  }

  @Delete('decaissement/:id')
  removeDecaissement(@Param('id', ParseIntPipe) id: number) {
    return this.traitesService.removeDecaissement(id);
  }
}
