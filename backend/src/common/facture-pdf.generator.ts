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
const FONTS_JSON = path.join(process.cwd(), 'assets', 'fonts.json');
const IMG_W = 1086;
const IMG_H = 1448;
const PAGE_W = 576;
const PAGE_H = 768;

let fonts: any = {};
if (fs.existsSync(FONTS_JSON)) {
  try {
    fonts = JSON.parse(fs.readFileSync(FONTS_JSON, 'utf-8'));
  } catch (err) {
    console.error('Failed to parse fonts.json', err);
  }
}

/**
 * Coordonnées calibrées sur TEMPLATE-OXYRAL.png (1086×1448 px)
 */
const F = {
  date: { x: 555, y: 187 },
  numero: { x: 825, y: 187 },
  telephone: { x: 200, y: 402 },
  mail: { x: 150, y: 429 },
  client: {
    x: 540,
    w: 480,
    yNom: 314,
    yAdr1: 352,
    yVille: 379,
    xIce: 600,
    wIce: 300,
    yIce: 418,
  },
  codeClient: { x: 56, y: 539, w: 186 },
  bonCommande: { x: 250, y: 539, w: 220 },
  numeroAttach: { x: 482, y: 539, w: 188 },
  conditionPaiement: { x: 650, y: 541, w: 370 },
  table: {
    y0: 640,
    step: 38,
    maxRows: 12,
    designation: { x: 185, w: 395 },
    qte: { x: 588, w: 112 },
    puHt: { x: 708, w: 116 },
    montantHt: { x: 832, w: 180 },
  },
  totalHorsTaxe: { x: 832, y: 1028, w: 180 },
  totalHt: { x: 56, y: 1145, w: 356 },
  totalTva: { x: 412, y: 1145, w: 300 },
  totalTtc: { x: 712, y: 1145, w: 308 },
  montantLettres: { x: 510, y: 1243, w: 480 },
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
  conditionPaiement?: string | null;
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
    fill?: string;
  } = {},
): string {
  if (!text) return '';
  const size = opts.size ?? 11;
  const anchor = opts.anchor ?? 'start';
  let px = x;
  if (anchor === 'middle' && opts.width) px = x + opts.width / 2;
  if (anchor === 'end') px = x;
  const fill = opts.fill ?? '#1a1a1a';
  return `<text x="${px}" y="${y + size}" font-family="Montserrat, Arial, Helvetica, sans-serif" font-size="${size}" font-weight="${opts.weight ?? 'normal'}" text-anchor="${anchor}" fill="${fill}">${esc(text)}</text>`;
}

function svgBox(
  text: string,
  x: number,
  y: number,
  w: number,
  size = 11,
  weight = 'normal',
  fill?: string,
): string {
  return svgText(text, x, y, { size, weight, anchor: 'middle', width: w, fill });
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

  parts.push(svgText(formatDateFacture(data.dateFacture), F.date.x, F.date.y, { size: 21, weight: 'bold' }));
  parts.push(svgText(data.numeroFacture, F.numero.x, F.numero.y, { size: 21, weight: 'bold' }));

  if (data.telephone) {
    parts.push(svgText(data.telephone, F.telephone.x, F.telephone.y, { size: 19, weight: 'bold' }));
  }
  if (data.mail) {
    parts.push(svgText(data.mail, F.mail.x, F.mail.y, { size: 20, weight: 'bold' }));
  }

  parts.push(
    svgBox(data.clientNom.toUpperCase(), F.client.x, F.client.yNom, F.client.w, 24, 'bold'),
  );
  if (ligne1) {
    parts.push(
      svgBox(ligne1.toUpperCase(), F.client.x, F.client.yAdr1, F.client.w, 16),
    );
  }
  if (ville) {
    parts.push(
      svgBox(ville.toUpperCase(), F.client.x, F.client.yVille, F.client.w, 19, 'bold'),
    );
  } else if (ligne1 && !ville) {
    // Une seule ligne d'adresse sans ville séparée
  }
  if (data.clientIce) {
    // Mask pre-printed "ICE :" label
    parts.push(`<rect x="545" y="412" width="470" height="28" fill="#ffffff" />`);
    parts.push(
      svgBox(`ICE : ${data.clientIce}`, F.client.x, F.client.yIce, F.client.w, 26, 'bold'),
    );
  }

  parts.push(svgBox(data.codeClient, F.codeClient.x, F.codeClient.y, F.codeClient.w, 19, 'bold'));
  if (data.bonCommande) {
    parts.push(svgBox(data.bonCommande, F.bonCommande.x, F.bonCommande.y, F.bonCommande.w, 19, 'bold'));
  }
  if (data.numeroAttach) {
    parts.push(
      svgBox(data.numeroAttach, F.numeroAttach.x, F.numeroAttach.y, F.numeroAttach.w, 19, 'bold'),
    );
  }


  if (data.conditionPaiement) {
    parts.push(
      svgBox(
        data.conditionPaiement.toUpperCase(),
        F.conditionPaiement.x,
        F.conditionPaiement.y,
        F.conditionPaiement.w,
        18,
        'bold',
      ),
    );
  }

  let rowY = F.table.y0;
  for (const ligne of data.lignes.slice(0, F.table.maxRows)) {
    const descLines = wrapDesignation(ligne.designation);
    descLines.forEach((line, i) => {
      parts.push(
        svgText(line, F.table.designation.x, rowY + i * 22, { size: 19, weight: 'bold' }),
      );
    });

    const numY = rowY + Math.max(0, (descLines.length - 1) * 11);
    parts.push(
      svgBox(formatMontantFacture(ligne.quantite), F.table.qte.x, numY, F.table.qte.w, 19, 'bold'),
    );
    parts.push(
      svgBox(formatMontantFacture(ligne.prixUnitaire), F.table.puHt.x, numY, F.table.puHt.w, 19, 'bold'),
    );
    parts.push(
      svgBox(formatMontantFacture(ligne.montantHt), F.table.montantHt.x, numY, F.table.montantHt.w, 19, 'bold'),
    );

    rowY += Math.max(F.table.step, descLines.length * 24) + 12;
    if (rowY > F.totalHorsTaxe.y - 25) break;
  }

  parts.push(
    svgBox(
      formatMontantFacture(data.totalHt),
      F.totalHorsTaxe.x,
      F.totalHorsTaxe.y,
      F.totalHorsTaxe.w,
      19,
      'bold',
    ),
  );
  parts.push(
    svgBox(formatMontantFacture(data.totalHt), F.totalHt.x, F.totalHt.y, F.totalHt.w, 21, 'bold'),
  );
  parts.push(
    svgBox(formatMontantFacture(data.totalTva), F.totalTva.x, F.totalTva.y, F.totalTva.w, 21, 'bold'),
  );
  parts.push(
    svgBox(formatMontantFacture(data.totalTtc), F.totalTtc.x, F.totalTtc.y, F.totalTtc.w, 21, 'bold'),
  );
  parts.push(
    svgText(data.montantEnLettres, F.montantLettres.x, F.montantLettres.y, {
      size: 16,
      weight: 'bold',
    }),
  );

  const fontStyle = fonts.MontserratRegular
    ? `<defs>
        <style type="text/css">
          @font-face {
            font-family: 'Montserrat';
            src: url(data:font/truetype;charset=utf-8;base64,${fonts.MontserratRegular}) format('truetype');
            font-weight: normal;
            font-style: normal;
          }
          @font-face {
            font-family: 'Montserrat';
            src: url(data:font/truetype;charset=utf-8;base64,${fonts.MontserratBold}) format('truetype');
            font-weight: bold;
            font-style: normal;
          }
        </style>
      </defs>`
    : '';

  const svg = `<svg width="${IMG_W}" height="${IMG_H}" xmlns="http://www.w3.org/2000/svg">${fontStyle}${parts.join('')}</svg>`;
  const composed = await sharp(TEMPLATE)
    .resize(IMG_W, IMG_H)
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
