/**
 * Script de calibration des champs sur facture-template.png (768×1024 px).
 * Usage: node scripts/calibrate-facture-fields.js
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const TEMPLATE = path.join(__dirname, '..', 'assets', 'facture-template.png');
const OUT = path.join(__dirname, '..', 'assets', 'facture-calibration.png');

const FIELDS = [
  { label: 'date', x: 618, y: 91 },
  { label: 'numero', x: 618, y: 114 },
  { label: 'telephone', x: 168, y: 211 },
  { label: 'mail', x: 168, y: 234 },
  { label: 'clientNom', x: 572, y: 179 },
  { label: 'clientAdr1', x: 572, y: 198 },
  { label: 'clientVille', x: 572, y: 216 },
  { label: 'clientIce', x: 572, y: 247 },
  { label: 'codeClient', x: 94, y: 300 },
  { label: 'bonCommande', x: 207, y: 300 },
  { label: 'numeroAttach', x: 327, y: 300 },
  { label: 'rib', x: 567, y: 300 },
  { label: 'table-y0', x: 118, y: 371 },
  { label: 'totalHTrow', x: 753, y: 707 },
  { label: 'totalHt', x: 323, y: 767 },
  { label: 'totalTva', x: 473, y: 767 },
  { label: 'totalTtc', x: 623, y: 767 },
  { label: 'montantLettres', x: 318, y: 811 },
];

async function main() {
  if (!fs.existsSync(TEMPLATE)) {
    console.error('Template introuvable:', TEMPLATE);
    process.exit(1);
  }
  const markers = FIELDS.map(
    (f) =>
      `<circle cx="${f.x}" cy="${f.y}" r="4" fill="red"/><text x="${f.x + 6}" y="${f.y + 4}" font-size="10" fill="red">${f.label}</text>`,
  ).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg">${markers}</svg>`;
  await sharp(TEMPLATE)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toFile(OUT);
  console.log('Calibration image:', OUT);
}

main().catch(console.error);
