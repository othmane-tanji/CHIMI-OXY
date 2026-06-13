const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const TEMPLATE = path.join(__dirname, '..', 'assets', 'facture-template.png');
const OUT = path.join(__dirname, '..', 'assets', 'facture-grid.png');

async function main() {
  if (!fs.existsSync(TEMPLATE)) {
    console.error('Template introuvable:', TEMPLATE);
    process.exit(1);
  }

  const svgParts = [];

  // Draw vertical grid lines every 50px
  for (let x = 0; x < 768; x += 50) {
    svgParts.push(`<line x1="${x}" y1="0" x2="${x}" y2="1024" stroke="rgba(255,0,0,0.3)" stroke-width="1"/>`);
    svgParts.push(`<text x="${x + 2}" y="15" font-size="8" fill="red">${x}</text>`);
  }

  // Draw horizontal grid lines every 50px
  for (let y = 0; y < 1024; y += 50) {
    svgParts.push(`<line x1="0" y1="${y}" x2="768" y2="${y}" stroke="rgba(0,0,255,0.3)" stroke-width="1"/>`);
    svgParts.push(`<text x="2" y="${y - 2}" font-size="8" fill="blue">${y}</text>`);
  }

  // Draw ticks every 10px
  for (let x = 0; x < 768; x += 10) {
    if (x % 50 !== 0) {
      svgParts.push(`<line x1="${x}" y1="0" x2="${x}" y2="8" stroke="rgba(255,0,0,0.15)" stroke-width="0.5"/>`);
    }
  }
  for (let y = 0; y < 1024; y += 10) {
    if (y % 50 !== 0) {
      svgParts.push(`<line x1="0" y1="${y}" x2="8" y2="${y}" stroke="rgba(0,0,255,0.15)" stroke-width="0.5"/>`);
    }
  }

  const svg = `<svg width="768" height="1024" xmlns="http://www.w3.org/2000/svg">${svgParts.join('')}</svg>`;

  await sharp(TEMPLATE)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toFile(OUT);

  console.log('Grid image written to:', OUT);
}

main().catch(console.error);
