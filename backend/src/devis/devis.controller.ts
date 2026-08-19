import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Delete,
  Res,
  ParseIntPipe,
} from '@nestjs/common';
import { DevisService } from './devis.service';
import { CreateDevisDto } from './dto/create-devis.dto';
import { Response } from 'express';
import * as path from 'path';

@Controller('devis')
export class DevisController {
  constructor(private readonly devisService: DevisService) {}

  @Post()
  create(@Body() createDevisDto: CreateDevisDto) {
    return this.devisService.create(createDevisDto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() createDevisDto: CreateDevisDto,
  ) {
    return this.devisService.update(id, createDevisDto);
  }

  @Get()
  findAll() {
    return this.devisService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.devisService.findOne(id);
  }

  @Get(':id/download')
  async downloadDocx(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const devis = await this.devisService.findOne(id);
    if (!devis.docxPath) {
      throw new Error('Document Word introuvable pour ce devis');
    }
    const filePath = path.join(process.cwd(), devis.docxPath);
    const filename = `devis-${devis.numeroDevis.replace(/\//g, '-')}.docx`;
    res.download(filePath, filename);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.devisService.delete(id);
  }
}
