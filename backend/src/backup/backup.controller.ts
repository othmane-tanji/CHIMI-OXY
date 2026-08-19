import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('backup')
@UseGuards(JwtAuthGuard)
export class BackupController {
  @Get('download')
  downloadBackup(@Res() res: Response) {
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');

    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({ message: 'Base de données non trouvée' });
    }

    const today = new Date().toISOString().split('T')[0];
    const filename = `beta_erp_backup_${today}.db`;

    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    const fileStream = fs.createReadStream(dbPath);
    fileStream.pipe(res);
  }
}
