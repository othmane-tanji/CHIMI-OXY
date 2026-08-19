const sharp = require('sharp');
const path = require('path');

async function main() {
  const imgPath = path.join(__dirname, '../assets/facture-template.png');
  const { data, info } = await sharp(imgPath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const channels = info.channels;

  // Let's first identify the bounds of the blue box
  let minBlueX = w, maxBlueX = 0, minBlueY = h, maxBlueY = 0;
  let blueFound = false;

  for (let y = 50; y < 200; y++) {
    for (let x = 400; x < 1000; x++) {
      const idx = (y * w + x) * channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      if (b > 150 && r < 50 && g < 100) {
        blueFound = true;
        if (x < minBlueX) minBlueX = x;
        if (x > maxBlueX) maxBlueX = x;
        if (y < minBlueY) minBlueY = y;
        if (y > maxBlueY) maxBlueY = y;
      }
    }
  }

  console.log(`Blue box bounds: x [${minBlueX}, ${maxBlueX}], y [${minBlueY}, ${maxBlueY}]`);

  // Now, find white pixels ONLY within the blue box bounds
  let minX = w, maxX = 0, minY = h, maxY = 0;
  let found = false;

  for (let y = minBlueY + 2; y <= maxBlueY - 2; y++) {
    for (let x = minBlueX + 2; x <= maxBlueX - 2; x++) {
      const idx = (y * w + x) * channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      // White text check
      if (r > 240 && g > 240 && b > 240) {
        found = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (found) {
    console.log(`Detected white text strictly inside blue box:`);
    console.log(`x: ${minX} to ${maxX} (width: ${maxX - minX + 1})`);
    console.log(`y: ${minY} to ${maxY} (height: ${maxY - minY + 1})`);
  } else {
    console.log('No white text found inside blue box');
  }
}

main().catch(console.error);
