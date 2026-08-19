const sharp = require('sharp');
const path = require('path');

async function main() {
  const imgPath = path.join(__dirname, '../assets/facture-template-chimiral.png');
  const { data, info } = await sharp(imgPath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const channels = info.channels;

  // Let's find the bounding box of non-white pixels (where R < 240 or G < 240 or B < 240)
  // in the top-right quadrant (x from 500 to 1050, y from 40 to 220)
  let minX = w, maxX = 0, minY = h, maxY = 0;
  let found = false;

  for (let y = 40; y < 220; y++) {
    for (let x = 500; x < 1050; x++) {
      const idx = (y * w + x) * channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      // non-white color check
      if (r < 240 || g < 240 || b < 240) {
        found = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (found) {
    console.log(`Detected title box boundaries:`);
    console.log(`x: ${minX} to ${maxX} (width: ${maxX - minX + 1})`);
    console.log(`y: ${minY} to ${maxY} (height: ${maxY - minY + 1})`);
  } else {
    console.log('No box found');
  }
}

main().catch(console.error);
