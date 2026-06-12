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
import { FacturesService } from './factures.service';
import { CreateFactureAchatDto, CreateFactureVenteDto } from './dto/create-facture.dto';
import { UpdateFactureDto } from './dto/update-facture.dto';

@Controller('factures')
@UseGuards(JwtAuthGuard)
export class FacturesController {
  constructor(private facturesService: FacturesService) {}

  @Get('achat')
  findAllAchat(
    @Query('search') search?: string,
    @Query('dateDebut') dateDebut?: string,
    @Query('dateFin') dateFin?: string,
  ) {
    return this.facturesService.findAllAchat({ search, dateDebut, dateFin });
  }

  @Post('achat')
  createAchat(@Body() dto: CreateFactureAchatDto) {
    return this.facturesService.createAchat(dto);
  }

  @Put('achat/:id')
  updateAchat(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFactureDto) {
    return this.facturesService.updateAchat(id, dto);
  }

  @Delete('achat/:id')
  removeAchat(@Param('id', ParseIntPipe) id: number) {
    return this.facturesService.removeAchat(id);
  }

  @Get('vente')
  findAllVente(
    @Query('search') search?: string,
    @Query('dateDebut') dateDebut?: string,
    @Query('dateFin') dateFin?: string,
  ) {
    return this.facturesService.findAllVente({ search, dateDebut, dateFin });
  }

  @Post('vente')
  createVente(@Body() dto: CreateFactureVenteDto) {
    return this.facturesService.createVente(dto);
  }

  @Put('vente/:id')
  updateVente(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFactureDto) {
    return this.facturesService.updateVente(id, dto);
  }

  @Delete('vente/:id')
  removeVente(@Param('id', ParseIntPipe) id: number) {
    return this.facturesService.removeVente(id);
  }
}
