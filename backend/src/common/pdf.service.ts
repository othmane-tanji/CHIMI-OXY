import { Injectable } from '@nestjs/common';
import PDFDocument = require('pdfkit');
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PdfService {
  private ensureDir(dir: string) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async generatePdf(
    folder: string,
    filename: string,
    build: (doc: PDFKit.PDFDocument) => void,
  ): Promise<string> {
    const storageDir = path.join(process.cwd(), 'storage', 'pdfs', folder);
    this.ensureDir(storageDir);

    const filePath = path.join(storageDir, filename);
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);

    return new Promise((resolve, reject) => {
      doc.pipe(stream);
      build(doc);
      doc.end();

      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    });
  }

  getRelativePath(fullPath: string): string {
    return path.relative(process.cwd(), fullPath).replace(/\\/g, '/');
  }
}
