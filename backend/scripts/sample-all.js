const sharp = require('sharp');
const path = require('path');

async function checkColors(filename) {
  const imgPath = path.join(__dirname, '../assets', filename);
  const { data, info } = await sharp(imgPath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const channels = info.channels;

  const samples = [
    [410, 100],
    [500, 100],
    [700, 100],
    [900, 100]
  ];
  
  console.log(`\nColors in ${filename}:`);
  for (const [x, y] of samples) {
    const idx = (y * w + x) * channels;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    console.log(`At (${x}, ${y}): RGB(${r}, ${g}, ${b})`);
  }
}

async function main() {
  await checkColors('facture-template.png');
  await checkColors('facture-template-chimiral.png');
}

main().catch(console.error);
