import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private logger = new Logger(MailService.name);

  async sendExcelBackupEmail(
    filename: string,
    buffer: Buffer,
    recipient: string = 'tangi.fat@gmail.com',
    subjectDetails?: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const host = process.env.SMTP_HOST || 'smtp.gmail.com';
      const port = parseInt(process.env.SMTP_PORT || '465', 10);
      const user = process.env.SMTP_USER || 'tangi.fat@gmail.com';
      const pass = process.env.SMTP_PASS || '';

      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: user && pass ? { user, pass } : undefined,
      });

      const mailOptions = {
        from: `"Beta ERP" <${user}>`,
        to: recipient,
        subject: filename,
        text: `Bonjour,\n\nVeuillez trouver ci-joint le fichier Excel : ${filename}.\n\nDate d'exportation : ${new Date().toLocaleString('fr-FR')}\n\nCordialement,\nBeta ERP System`,
        attachments: [
          {
            filename,
            content: buffer,
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          },
        ],
      };

      const info = await transporter.sendMail(mailOptions);
      this.logger.log(`Email envoyé avec succès à ${recipient}: ${info.messageId}`);
      return { success: true, message: `Email envoyé avec succès à ${recipient}` };
    } catch (error: any) {
      this.logger.warn(`Erreur d'envoi d'email SMTP: ${error.message}`);
      return { success: false, message: error.message };
    }
  }
}
