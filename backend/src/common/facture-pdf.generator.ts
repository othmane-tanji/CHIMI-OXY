import * as fs from 'fs';
import * as path from 'path';
import sharp = require('sharp');
import { PDFDocument } from 'pdf-lib';
import {
  formatDateFacture,
  formatMontantFacture,
  FactureLigneCalc,
} from './facture.utils';

const TEMPLATE = path.join(process.cwd(), 'assets', 'facture-template.png');
const IMG_W = 768;
const IMG_H = 1024;
const PAGE_W = 576;
const PAGE_H = 768;

/**
 * Coordonnées calibrées sur facture-template.png (768×1024)
 * d'après l'exemple PRIMARIOS / 2026-023.
 */
const F = {
  date: { x: 380, y: 134 },
  numero: { x: 570, y: 134 },
  telephone: { x: 145, y: 278 },
  mail: { x: 110, y: 299 },
  client: {
    x: 380,
    w: 340,
    yNom: 221,
    yAdr1: 249,
    yVille: 271,
    xIce: 425,
    wIce: 215,
    yIce: 283,
  },
  codeClient: { x: 46, y: 364, w: 131 },
  bonCommande: { x: 177, y: 364, w: 156 },
  numeroAttach: { x: 333, y: 364, w: 133 },
  rib: { x: 466, y: 364, w: 254 },
  table: {
    y0: 438,
    step: 28,
    maxRows: 12,
    designation: { x: 128, w: 287 },
    qte: { x: 421, w: 80 },
    puHt: { x: 507, w: 82 },
    montantHt: { x: 595, w: 119 },
  },
  totalHorsTaxe: { x: 595, y: 696, w: 119 },
  totalHt: { x: 46, y: 790, w: 224 },
  totalTva: { x: 270, y: 790, w: 235 },
  totalTtc: { x: 505, y: 790, w: 215 },
  montantLettres: { x: 320, y: 885, w: 390 },
};

export interface FacturePdfData {
  numeroFacture: string;
  dateFacture: Date | string;
  telephone: string;
  mail: string;
  clientNom: string;
  clientAdresse: string;
  clientIce?: string | null;
  codeClient: string;
  bonCommande?: string | null;
  numeroAttach?: string | null;
  rib?: string | null;
  lignes: FactureLigneCalc[];
  totalHt: number;
  totalTva: number;
  totalTtc: number;
  montantEnLettres: string;
}

function esc(text: string): string {
  return text
    .replace(/[\u202f\u00a0]/g, ' ')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function svgText(
  text: string,
  x: number,
  y: number,
  opts: {
    size?: number;
    weight?: string;
    anchor?: 'start' | 'middle' | 'end';
    width?: number;
  } = {},
): string {
  if (!text) return '';
  const size = opts.size ?? 11;
  const anchor = opts.anchor ?? 'start';
  let px = x;
  if (anchor === 'middle' && opts.width) px = x + opts.width / 2;
  if (anchor === 'end') px = x;
  return `<text x="${px}" y="${y + size}" font-family="Arial,Helvetica,sans-serif" font-size="${size}" font-weight="${opts.weight ?? 'normal'}" text-anchor="${anchor}" fill="#1a1a1a">${esc(text)}</text>`;
}

function svgBox(
  text: string,
  x: number,
  y: number,
  w: number,
  size = 11,
  weight = 'normal',
): string {
  return svgText(text, x, y, { size, weight, anchor: 'middle', width: w });
}

function splitClientAdresse(adresse: string): { ligne1: string; ville: string } {
  const trimmed = adresse.trim();
  if (!trimmed) return { ligne1: '', ville: '' };

  const sep = trimmed.split(/\s*[—–-]\s*/);
  if (sep.length >= 2) {
    return { ligne1: sep[0].trim(), ville: sep.slice(1).join(' ').trim() };
  }

  const parts = trimmed.split(/\s+/);
  const last = parts[parts.length - 1];
  if (parts.length > 1 && last === last.toUpperCase() && last.length >= 3) {
    return { ligne1: parts.slice(0, -1).join(' '), ville: last };
  }

  return { ligne1: trimmed, ville: '' };
}

function wrapDesignation(text: string, maxLen = 38): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLen && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 4);
}

export async function generateFactureVentePdf(
  data: FacturePdfData,
  outputPath: string,
): Promise<void> {
  if (!fs.existsSync(TEMPLATE)) {
    throw new Error(
      `Modèle introuvable : ${TEMPLATE}. Placez facture-template.png dans backend/assets/`,
    );
  }

  const parts: string[] = [];
  const { ligne1, ville } = splitClientAdresse(data.clientAdresse);

  parts.push(svgText(formatDateFacture(data.dateFacture), F.date.x, F.date.y, { size: 11 }));
  parts.push(svgText(data.numeroFacture, F.numero.x, F.numero.y, { size: 11 }));

  if (data.telephone) {
    parts.push(svgText(data.telephone, F.telephone.x, F.telephone.y, { size: 11 }));
  }
  if (data.mail) {
    parts.push(svgText(data.mail, F.mail.x, F.mail.y, { size: 11 }));
  }

  parts.push(
    svgBox(data.clientNom.toUpperCase(), F.client.x, F.client.yNom, F.client.w, 11, 'bold'),
  );
  if (ligne1) {
    parts.push(
      svgBox(ligne1.toUpperCase(), F.client.x, F.client.yAdr1, F.client.w, 11, 'bold'),
    );
  }
  if (ville) {
    parts.push(
      svgBox(ville.toUpperCase(), F.client.x, F.client.yVille, F.client.w, 13, 'bold'),
    );
  } else if (ligne1 && !ville) {
    // Une seule ligne d'adresse sans ville séparée
  }
  if (data.clientIce) {
    parts.push(svgBox(data.clientIce, F.client.xIce, F.client.yIce, F.client.wIce, 11));
  }

  parts.push(svgBox(data.codeClient, F.codeClient.x, F.codeClient.y, F.codeClient.w));
  if (data.bonCommande) {
    parts.push(svgBox(data.bonCommande, F.bonCommande.x, F.bonCommande.y, F.bonCommande.w));
  }
  if (data.numeroAttach) {
    parts.push(
      svgBox(data.numeroAttach, F.numeroAttach.x, F.numeroAttach.y, F.numeroAttach.w),
    );
  }
  if (data.rib) {
    parts.push(svgBox(data.rib, F.rib.x, F.rib.y, F.rib.w, 9));
  }

  let rowY = F.table.y0;
  for (const ligne of data.lignes.slice(0, F.table.maxRows)) {
    const descLines = wrapDesignation(ligne.designation);
    descLines.forEach((line, i) => {
      parts.push(
        svgText(line, F.table.designation.x, rowY + i * 12, { size: 10 }),
      );
    });

    const numY = rowY + Math.max(0, (descLines.length - 1) * 6);
    parts.push(
      svgText(formatMontantFacture(ligne.quantite), F.table.qte.x + F.table.qte.w, numY, {
        anchor: 'end',
        size: 10,
      }),
    );
    parts.push(
      svgText(formatMontantFacture(ligne.prixUnitaire), F.table.puHt.x + F.table.puHt.w, numY, {
        anchor: 'end',
        size: 10,
      }),
    );
    parts.push(
      svgText(formatMontantFacture(ligne.montantHt), F.table.montantHt.x + F.table.montantHt.w, numY, {
        anchor: 'end',
        size: 10,
      }),
    );

    rowY += Math.max(F.table.step, descLines.length * 14);
    if (rowY > F.totalHorsTaxe.y - 20) break;
  }

  parts.push(
    svgText(
      formatMontantFacture(data.totalHt),
      F.totalHorsTaxe.x + F.totalHorsTaxe.w,
      F.totalHorsTaxe.y,
      { anchor: 'end', size: 10, weight: 'bold' },
    ),
  );
  parts.push(
    svgBox(formatMontantFacture(data.totalHt), F.totalHt.x, F.totalHt.y, F.totalHt.w, 11, 'bold'),
  );
  parts.push(
    svgBox(formatMontantFacture(data.totalTva), F.totalTva.x, F.totalTva.y, F.totalTva.w, 11, 'bold'),
  );
  parts.push(
    svgBox(formatMontantFacture(data.totalTtc), F.totalTtc.x, F.totalTtc.y, F.totalTtc.w, 11, 'bold'),
  );
  parts.push(
    svgText(data.montantEnLettres, F.montantLettres.x, F.montantLettres.y, {
      size: 10,
      weight: 'bold',
    }),
  );

  const svg = `<svg width="${IMG_W}" height="${IMG_H}" xmlns="http://www.w3.org/2000/svg">${parts.join('')}</svg>`;
  const composed = await sharp(TEMPLATE)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toBuffer();

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  const png = await pdfDoc.embedPng(composed);
  page.drawImage(png, { x: 0, y: 0, width: PAGE_W, height: PAGE_H });
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, await pdfDoc.save());
}
