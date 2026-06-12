const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const REF_W = 768;
const REF_H = 1024;
const PW = 528;
const PH = 704;
const SX = PW / REF_W;
const SY = PH / REF_H;
const tpl = path.join(__dirname, '..', 'assets', 'template-vide.png');
const out = path.join(__dirname, '..', 'assets', 'calibration-overlay.pdf');

const points = [
  ['CNSS', 120, 90],
  ['periode', 574, 88],
  ['matricule', 18, 154],
  ['nom', 86, 154],
  ['adresse', 92, 175],
  ['naissance', 14, 211],
  ['row0', 14, 228],
  ['row5', 14, 288],
  ['dec200', 98, 885],
  ['total', 553, 919],
  ['net', 628, 932],
  ['cumul', 8, 955],
];

const doc = new PDFDocument({ size: [PW, PH], margin: 0 });
doc.pipe(fs.createWriteStream(out));
doc.image(tpl, 0, 0, { width: PW, height: PH });
doc.font('Times-Roman').fontSize(6).fillColor('red');
for (const [label, ix, iy] of points) {
  const x = ix * SX;
  const y = iy * SY;
  doc.circle(x, y, 2).fill();
  doc.fillColor('red').text(label, x + 4, y - 3, { lineBreak: false });
}
doc.end();
console.log('Wrote', out);
