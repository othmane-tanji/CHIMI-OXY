/**
 * Overlay rouge sur le modèle pour vérifier les coordonnées F.*
 * Usage: node scripts/calibrate-fields.js
 */
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

const TEMPLATE = path.join(__dirname, '..', 'assets', 'template-form.png');
const OUT = path.join(__dirname, '..', 'assets', 'calibration-fields.pdf');
const CROP_W = 723;
const CROP_H = 952;
const PAGE_W = 526.5;
const PAGE_H = 690.75;
const SX = PAGE_W / CROP_W;
const SY = PAGE_H / CROP_H;

const points = [
  ['cnss', 105, 73],
  ['du', 545, 100],
  ['au', 625, 100],
  ['mat', 12, 128],
  ['nom', 68, 128],
  ['adr', 115, 176],
  ['adm', 12, 256],
  ['t0', 12, 290],
  ['t5', 12, 348],
  ['dec', 72, 855],
  ['tot', 470, 878],
  ['net', 580, 898],
  ['cum', 12, 915],
];

(async () => {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([PAGE_W, PAGE_H]);
  const bg = await pdf.embedPng(fs.readFileSync(TEMPLATE));
  page.drawImage(bg, { x: 0, y: 0, width: PAGE_W, height: PAGE_H });
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  for (const [label, x, yTop] of points) {
    const px = x * SX;
    const py = PAGE_H - yTop * SY;
    page.drawCircle({ x: px, y: py, size: 2, color: rgb(1, 0, 0), borderColor: rgb(1, 0, 0) });
    page.drawText(label, { x: px + 3, y: py + 2, size: 5, font, color: rgb(1, 0, 0) });
  }
  fs.writeFileSync(OUT, await pdf.save());
  console.log('Wrote', OUT);
})();
