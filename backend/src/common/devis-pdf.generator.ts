import * as fs from 'fs';
import * as path from 'path';
import sharp = require('sharp');
import { PDFDocument } from 'pdf-lib';

const FONTS_JSON = path.join(process.cwd(), 'assets', 'fonts.json');
const IMG_W = 1190;
const IMG_H = 1683;
const PAGE_W = 595.276;
const PAGE_H = 841.89;

let fonts: any = {};
if (fs.existsSync(FONTS_JSON)) {
  try {
    fonts = JSON.parse(fs.readFileSync(FONTS_JSON, 'utf-8'));
  } catch (err) {
    console.error('Failed to parse fonts.json', err);
  }
}

export interface DevisLigneData {
  designation: string;
  surface: number;
  prixUnitaire: number;
  montantHt: number;
}

export interface DevisPdfData {
  numeroDevis: string;
  dateDevis: Date | string;
  objet: string;
  lignes: DevisLigneData[];
  totalHt: number;
  totalTva: number;
  totalTtc: number;
}

function esc(text: string): string {
  return text
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
  const fill = opts.fill ?? '#1a1a1a';
  return `<text x="${px}" y="${y + size}" font-family="Montserrat, Arial, sans-serif" font-size="${size}" font-weight="${opts.weight ?? 'normal'}" text-anchor="${anchor}" fill="${fill}">${esc(text)}</text>`;
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

function wrapText(text: string, maxLen = 45): string[] {
  const words = text.trim().split(/\s+/);
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
  return lines;
}

function formatDate(d: Date | string): string {
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const yyyy = dateObj.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatAmount(num: number): string {
  return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export async function generateDevisPdf(
  data: DevisPdfData,
  outputPath: string,
): Promise<void> {
  const pdfDoc = await PDFDocument.create();
  const marginX = 15;
  const marginY = 15;
  
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

  // --- Page 1 ---
  const t1Path = path.join(process.cwd(), 'assets', 'devis-template-page1.png');
  const p1Parts: string[] = [
    // Mask pre-printed devis number
    '<rect x="290" y="410" width="410" height="42" fill="#ffffff" />',
    svgText(data.numeroDevis, 290, 410, { size: 24, weight: 'bold' }),
    
    // Mask pre-printed date
    '<rect x="980" y="495" width="170" height="30" fill="#ffffff" />',
    svgText(formatDate(data.dateDevis), 980, 495, { size: 20, weight: 'bold' }),
    
    // Mask pre-printed object
    '<rect x="210" y="630" width="940" height="40" fill="#ffffff" />',
    svgText(data.objet, 210, 630, { size: 21, weight: 'bold' })
  ];
  
  const p1Svg = `<svg width="${IMG_W}" height="${IMG_H}" xmlns="http://www.w3.org/2000/svg">${fontStyle}${p1Parts.join('')}</svg>`;
  const p1Composed = await sharp(t1Path)
    .composite([{ input: Buffer.from(p1Svg), top: 0, left: 0 }])
    .png()
    .toBuffer();
  
  const p1 = pdfDoc.addPage([PAGE_W, PAGE_H]);
  const p1Png = await pdfDoc.embedPng(p1Composed);
  p1.drawImage(p1Png, { x: marginX, y: marginY, width: PAGE_W - 2 * marginX, height: PAGE_H - 2 * marginY });

  // --- Page 2 ---
  const t2Path = path.join(process.cwd(), 'assets', 'devis-template-page2.png');
  const p2Parts: string[] = [
    // Mask pre-printed reference at top
    '<rect x="490" y="225" width="310" height="30" fill="#ffffff" />',
    svgText(`réf Devis ${data.numeroDevis}`, 490, 225, { size: 16, weight: 'bold' }),
    
    // Mask pre-printed rows in table
    '<rect x="100" y="382" width="97" height="412" fill="#e0ecf7" />',
    '<rect x="198" y="382" width="893" height="412" fill="#ffffff" />',
    
    // Re-draw separator lines
    '<line x1="197" y1="382" x2="197" y2="794" stroke="#ffffff" stroke-width="2" />',
    '<line x1="736" y1="382" x2="736" y2="794" stroke="#ffffff" stroke-width="2" />',
    '<line x1="849" y1="382" x2="849" y2="794" stroke="#ffffff" stroke-width="2" />',
    '<line x1="950" y1="382" x2="950" y2="794" stroke="#ffffff" stroke-width="2" />',
    
    // Mask pre-printed totals boxes
    '<rect x="951" y="800" width="140" height="23" fill="#ffffff" />',
    '<rect x="951" y="864" width="140" height="21" fill="#ffffff" />',
    '<rect x="951" y="921" width="140" height="27" fill="#ffffff" />'
  ];
  
  let rowY = 398;
  const step = 38;
  data.lignes.slice(0, 10).forEach((ligne, i) => {
    // Index
    p2Parts.push(svgBox(String(i + 1), 100, rowY, 97, 16, 'bold'));
    
    // Designation (wrap)
    const descLines = wrapText(ligne.designation, 48);
    descLines.forEach((line, j) => {
      p2Parts.push(svgText(line, 210, rowY + j * 20, { size: 16, weight: 'bold' }));
    });
    
    // Surface
    p2Parts.push(svgBox(formatAmount(ligne.surface), 738, rowY, 110, 16, 'bold'));
    
    // Prix U HT
    p2Parts.push(svgBox(formatAmount(ligne.prixUnitaire), 851, rowY, 97, 16, 'bold'));
    
    // Total ligne HT
    p2Parts.push(svgBox(formatAmount(ligne.montantHt), 951, rowY, 140, 16, 'bold'));
    
    rowY += Math.max(step, descLines.length * 20) + 8;
  });
  
  // Draw calculated totals
  p2Parts.push(svgBox(formatAmount(data.totalHt), 951, 802, 140, 16, 'bold'));
  p2Parts.push(svgBox(formatAmount(data.totalTva), 951, 865, 140, 16, 'bold'));
  p2Parts.push(svgBox(formatAmount(data.totalTtc), 951, 925, 140, 18, 'bold'));

  const p2Svg = `<svg width="${IMG_W}" height="${IMG_H}" xmlns="http://www.w3.org/2000/svg">${fontStyle}${p2Parts.join('')}</svg>`;
  const p2Composed = await sharp(t2Path)
    .composite([{ input: Buffer.from(p2Svg), top: 0, left: 0 }])
    .png()
    .toBuffer();
    
  const p2 = pdfDoc.addPage([PAGE_W, PAGE_H]);
  const p2Png = await pdfDoc.embedPng(p2Composed);
  p2.drawImage(p2Png, { x: marginX, y: marginY, width: PAGE_W - 2 * marginX, height: PAGE_H - 2 * marginY });

  // --- Page 3 & 4 (Static conditions) ---
  for (let pageNum = 3; pageNum <= 4; pageNum++) {
    const tPath = path.join(process.cwd(), 'assets', `devis-template-page${pageNum}.png`);
    const pageComposed = await sharp(tPath).png().toBuffer();
    
    const page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    const pagePng = await pdfDoc.embedPng(pageComposed);
    page.drawImage(pagePng, { x: marginX, y: marginY, width: PAGE_W - 2 * marginX, height: PAGE_H - 2 * marginY });
  }

  // Save the document
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, await pdfDoc.save());
}
