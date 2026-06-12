import { Module } from '@nestjs/common';
import { TraitesService } from './traites.service';
import { TraitesController } from './traites.controller';
import { PdfService } from '../common/pdf.service';

@Module({
  controllers: [TraitesController],
  providers: [TraitesService, PdfService],
})
export class TraitesModule {}
