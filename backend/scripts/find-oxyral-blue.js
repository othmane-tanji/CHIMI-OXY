const sharp = require('sharp');
const path = require('path');

async function main() {
  const imgPath = path.join(__dirname, '../assets/facture-template.png');
  const { data, info } = await sharp(imgPath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const channels = info.channels;

  // Let's find the bounding box of pixels matching the blue color (R=3, G=48, B=160)
  // or close to it (distance < 10)
  let minX = w, maxX = 0, minY = h, maxY = 0;
  let found = false;

  for (let y = 40; y < 200; y++) {
    for (let x = 400; x < 1050; x++) {
      const idx = (y * w + x) * channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      const dist = Math.sqrt((r - 3)**2 + (g - 48)**2 + (b - 160)**2);
      if (dist < 15) {
        found = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (found) {
    console.log(`Blue box for OXYRAL:`);
    console.log(`x: ${minX} to ${maxX} (width: ${maxX - minX + 1})`);
    console.log(`y: ${minY} to ${maxY} (height: ${maxY - minY + 1})`);
  } else {
    console.log('Blue box not found');
  }
}

main().catch(console.error);
