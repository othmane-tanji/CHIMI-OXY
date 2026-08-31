import { Module } from '@nestjs/common';
import { CongesService } from './conges.service';
import { CongesController } from './conges.controller';
import { MailService } from '../common/mail.service';

@Module({
  controllers: [CongesController],
  providers: [CongesService, MailService],
  exports: [CongesService, MailService],
})
export class CongesModule {}
