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
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FacturesService } from './factures.service';
import {
  CreateFactureAchatDto,
  CreateFactureVenteDto,
  FactureLigneDto,
  UpdateFactureConfigDto,
} from './dto/create-facture.dto';
import {
  UpdateFactureDto,
  UpdateFactureVenteDto,
} from './dto/update-facture.dto';

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

  @Get('vente/prochain-numero')
  getProchainNumero(@Query('annee') annee?: string) {
    return this.facturesService.getProchainNumero(
      annee ? parseInt(annee, 10) : undefined,
    );
  }

  @Put('vente/config/:annee')
  setSequence(
    @Param('annee', ParseIntPipe) annee: number,
    @Body() dto: UpdateFactureConfigDto,
  ) {
    return this.facturesService.setSequence(annee, dto.sequence);
  }

  @Post('vente/calcul')
  calculPreview(@Body() body: { lignes: FactureLigneDto[] }) {
    return this.facturesService.calculerPreview(body.lignes);
  }

  @Get('vente/:id/pdf')
  async downloadVentePdf(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const facture = await this.facturesService.findOneVente(id);
    const pdfPath = await this.facturesService.regenerateVentePdf(id);
    const filePath = this.facturesService.getPdfAbsolutePath(pdfPath);
    const filename = `facture-${facture.numeroFacture.replace(/\//g, '-')}.pdf`;
    res.download(filePath, filename);
  }

  @Get('vente/:id')
  findOneVente(@Param('id', ParseIntPipe) id: number) {
    return this.facturesService.findOneVente(id);
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
  updateVente(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFactureVenteDto) {
    return this.facturesService.updateVente(id, dto);
  }

  @Delete('vente/:id')
  removeVente(@Param('id', ParseIntPipe) id: number) {
    return this.facturesService.removeVente(id);
  }
}
