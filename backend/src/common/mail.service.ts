import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER || '';
    const pass = process.env.SMTP_PASS || '';

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  async sendExcelBackupEmail(
    filename: string,
    buffer: Buffer,
    recipient: string = 'tangi.fat@gmail.com',
    subjectDetails: string = 'Export Excel Congés & Absences',
  ): Promise<{ success: boolean; message: string }> {
    try {
      const mailOptions = {
        from: '"Beta ERP Backup" <noreply@oxyral.ma>',
        to: recipient,
        subject: `[Beta ERP Backup] ${subjectDetails} (${new Date().toLocaleDateString('fr-FR')})`,
        text: `Bonjour,\n\nVeuillez trouver ci-joint la copie de sauvegarde du fichier Excel (${filename}) généré depuis Beta ERP.\n\nDate d'exportation : ${new Date().toLocaleString('fr-FR')}\n\nCordialement,\nBeta ERP System - Oxyral & Chimiral`,
        attachments: [
          {
            filename,
            content: buffer,
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          },
        ],
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email de sauvegarde envoyé avec succès à ${recipient}: ${info.messageId}`);
      return { success: true, message: `Email de sauvegarde envoyé à ${recipient}` };
    } catch (error: any) {
      this.logger.warn(`L'email de sauvegarde n'a pas pu être délivré (SMTP): ${error.message}`);
      return { success: false, message: `Sauvegarde générée. Note SMTP: ${error.message}` };
    }
  }
}
