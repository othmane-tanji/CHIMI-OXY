const sharp = require('sharp');
const path = require('path');

async function main() {
  const imgPath = path.join(__dirname, '../assets/facture-template-chimiral.png');
  const { data, info } = await sharp(imgPath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const channels = info.channels;

  // Sample at x = 500, y = 100 (inside the blue box)
  const idx = (100 * w + 500) * channels;
  const r = data[idx];
  const g = data[idx + 1];
  const b = data[idx + 2];
  
  const toHex = (c) => c.toString(16).padStart(2, '0');
  console.log(`RGB: rgb(${r}, ${g}, ${b})`);
  console.log(`Hex: #${toHex(r)}${toHex(g)}${toHex(b)}`);
}

main().catch(console.error);
