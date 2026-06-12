import { Module } from '@nestjs/common';
import { FacturesService } from './factures.service';
import { FacturesController } from './factures.controller';
import { PdfService } from '../common/pdf.service';

@Module({
  controllers: [FacturesController],
  providers: [FacturesService, PdfService],
})
export class FacturesModule {}
