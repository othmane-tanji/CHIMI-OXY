import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CongesService } from './conges.service';
import { CreateCongeDto } from './dto/create-conge.dto';
import { MailService } from '../common/mail.service';

@Controller('conges')
@UseGuards(JwtAuthGuard)
export class CongesController {
  constructor(
    private congesService: CongesService,
    private mailService: MailService,
  ) {}

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

  @Get('excel-global')
  async exportExcelGlobal(
    @Res() res: Response,
    @Query('annee') anneeStr?: string,
    @Query('sendEmail') sendEmailStr?: string,
    @Query('email') emailStr?: string,
  ) {
    const annee = anneeStr ? parseInt(anneeStr, 10) : new Date().getFullYear();
    const { filename, buffer } = await this.congesService.exportExcelGlobal(annee);

    if (sendEmailStr === 'true') {
      const recipient = emailStr || 'tangi.fat@gmail.com';
      const mailRes = await this.mailService.sendExcelBackupEmail(
        filename,
        buffer,
        recipient,
        `Master Export Global Congés (${annee})`,
      );
      res.setHeader('X-Email-Sent', mailRes.success ? 'true' : 'false');
      res.setHeader('X-Email-Message', encodeURIComponent(mailRes.message));
    }

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
      'Access-Control-Expose-Headers': 'Content-Disposition, X-Email-Sent, X-Email-Message',
    });

    res.send(buffer);
  }

  @Get('excel/:employeId')
  async exportExcel(
    @Res() res: Response,
    @Param('employeId', ParseIntPipe) employeId: number,
    @Query('annee') anneeStr?: string,
    @Query('mois') moisStr?: string,
    @Query('sendEmail') sendEmailStr?: string,
    @Query('email') emailStr?: string,
  ) {
    const annee = anneeStr ? parseInt(anneeStr, 10) : new Date().getFullYear();
    const mois = moisStr ? parseInt(moisStr, 10) : undefined;
    const { filename, buffer } = await this.congesService.exportExcel(employeId, annee, mois);

    if (sendEmailStr === 'true') {
      const recipient = emailStr || 'tangi.fat@gmail.com';
      const mailRes = await this.mailService.sendExcelBackupEmail(
        filename,
        buffer,
        recipient,
        `Export Congés - ${filename}`,
      );
      res.setHeader('X-Email-Sent', mailRes.success ? 'true' : 'false');
      res.setHeader('X-Email-Message', encodeURIComponent(mailRes.message));
    }

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
      'Access-Control-Expose-Headers': 'Content-Disposition, X-Email-Sent, X-Email-Message',
    });

    res.send(buffer);
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
  getSolde(
    @Param('employeId', ParseIntPipe) employeId: number,
    @Query('annee') annee?: string,
  ) {
    const year = annee ? +annee : undefined;
    return this.congesService.getSolde(employeId, year);
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
