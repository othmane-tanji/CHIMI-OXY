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
import { BulletinsService } from './bulletins.service';
import { CreateBulletinDto } from './dto/create-bulletin.dto';
import { UpdateBulletinDto } from './dto/update-bulletin.dto';

@Controller('bulletins')
@UseGuards(JwtAuthGuard)
export class BulletinsController {
  constructor(private bulletinsService: BulletinsService) {}

  @Get()
  findAll(@Query('employeId') employeId?: string) {
    return this.bulletinsService.findAll(employeId ? +employeId : undefined);
  }

  @Get('calcul-preview')
  getCalculPreview(
    @Query('employeId') employeId: string,
    @Query('mois') mois: string,
    @Query('annee') annee: string,
    @Query('salaireBase') salaireBase: string,
    @Query('nombreJours') nombreJours?: string,
    @Query('primes') primes?: string,
    @Query('indemniteTransport') indemniteTransport?: string,
    @Query('ir') ir?: string,
  ) {
    return this.bulletinsService.getCalculPreview(
      +employeId,
      +mois,
      +annee,
      +salaireBase,
      nombreJours ? +nombreJours : undefined,
      primes ? +primes : undefined,
      indemniteTransport ? +indemniteTransport : undefined,
      ir ? +ir : undefined,
    );
  }

  @Get(':id/pdf')
  async downloadPdf(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    let bulletin = await this.bulletinsService.findOne(id);
    const pdfPath = await this.bulletinsService.regeneratePdf(id);
    bulletin = { ...bulletin, pdfPath };
    const filePath = this.bulletinsService.getPdfAbsolutePath(bulletin);
    const filename = `bulletin-${bulletin.employe.prenom}-${bulletin.employe.nom}-${bulletin.mois}-${bulletin.annee}.pdf`;
    res.download(filePath, filename);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bulletinsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateBulletinDto) {
    return this.bulletinsService.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBulletinDto) {
    return this.bulletinsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.bulletinsService.remove(id);
  }
}
