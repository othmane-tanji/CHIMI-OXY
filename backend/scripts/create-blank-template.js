/**
 * Crée template-blank.png : modèle officiel avec toutes les valeurs effacées.
 */
const sharp = require('sharp');
const path = require('path');

const W = 1053;
const H = 1381;

async function main() {
  const src = path.join(__dirname, '..', 'assets', 'template-ref.png');
  const out = path.join(__dirname, '..', 'assets', 'template-blank.png');

  const wipes = [
    [855, 62, 172, 32],
    [30, 166, 995, 86],
    [32, 312, 988, 742],
    [30, 1054, 995, 94],
    [32, 1286, 988, 26],
  ];

  const rects = wipes
    .map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="white"/>`)
    .join('');

  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`;

  await sharp(src)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toFile(out);

  console.log('Blank template créé:', out);
}

main().catch(console.error);
