const sharp = require('sharp');
const path = require('path');

async function main() {
  const imgPath = path.join(__dirname, '../assets/facture-template.png');
  const { data, info } = await sharp(imgPath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const channels = info.channels;

  // Let's scan the top region: y from 50 to 200, x from 400 to 1000
  // We look for blue pixels. A blue pixel in this template will have high Blue and lower Red/Green.
  // Let's find the bounding box of pixels where B > 120 and R < 100 and G < 100
  let minX = w, maxX = 0, minY = h, maxY = 0;
  let found = false;

  for (let y = 50; y < 200; y++) {
    for (let x = 400; x < 1000; x++) {
      const idx = (y * w + x) * channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      // Blue color check
      if (b > 150 && r < 50 && g < 100) {
        found = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (found) {
    console.log(`Detected blue box: x from ${minX} to ${maxX} (width: ${maxX - minX + 1}), y from ${minY} to ${maxY} (height: ${maxY - minY + 1})`);
  } else {
    console.log('Blue box not found');
  }
}

main().catch(console.error);
