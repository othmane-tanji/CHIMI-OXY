import { Module } from '@nestjs/common';
import { EmployesService } from './employes.service';
import { EmployesController } from './employes.controller';

@Module({
  controllers: [EmployesController],
  providers: [EmployesService],
  exports: [EmployesService],
})
export class EmployesModule {}
