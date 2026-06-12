import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CongesService } from './conges.service';
import { CreateCongeDto } from './dto/create-conge.dto';

@Controller('conges')
@UseGuards(JwtAuthGuard)
export class CongesController {
  constructor(private congesService: CongesService) {}

  @Get()
  findAll(
    @Query('employeId') employeId?: string,
    @Query('mois') mois?: string,
    @Query('annee') annee?: string,
  ) {
    return this.congesService.findAll({
      employeId: employeId ? +employeId : undefined,
      mois: mois ? +mois : undefined,
      annee: annee ? +annee : undefined,
    });
  }

  @Get('soldes')
  getSoldes(
    @Query('mois') mois?: string,
    @Query('annee') annee?: string,
  ) {
    const now = new Date();
    const m = mois ? +mois : now.getMonth() + 1;
    const a = annee ? +annee : now.getFullYear();
    return this.congesService.getSoldes(m, a);
  }

  @Get('resume-mensuel/:employeId')
  getResumeMensuel(
    @Param('employeId', ParseIntPipe) employeId: number,
    @Query('annee') annee?: string,
  ) {
    const year = annee ? +annee : new Date().getFullYear();
    return this.congesService.getResumeMensuel(employeId, year);
  }

  @Get('solde/:employeId')
  getSolde(@Param('employeId', ParseIntPipe) employeId: number) {
    return this.congesService.getSolde(employeId);
  }

  @Post()
  create(@Body() dto: CreateCongeDto) {
    return this.congesService.create(dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.congesService.remove(id);
  }
}
