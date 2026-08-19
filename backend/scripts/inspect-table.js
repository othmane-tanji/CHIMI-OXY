const sharp = require('sharp');
const path = require('path');

async function checkTemplate(filename) {
  const imgPath = path.join(__dirname, '../assets', filename);
  const { data, info } = await sharp(imgPath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const channels = info.channels;

  console.log(`\n--- Lines detection for ${filename} (${w}x${h}) ---`);
  
  const horizontalLines = [];
  for (let y = 0; y < h; y++) {
    let darkCount = 0;
    const startX = 60;
    const endX = 1020;
    const total = endX - startX;
    
    for (let x = startX; x < endX; x++) {
      const idx = (y * w + x) * channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const brightness = (r + g + b) / 3;
      if (brightness < 180) {
        darkCount++;
      }
    }
    
    if (darkCount / total > 0.7) {
      horizontalLines.push(y);
    }
  }
  
  console.log('Horizontal lines at y-coordinates:', horizontalLines);
  
  // Let's find vertical lines to confirm table boundaries
  const verticalLines = [];
  for (let x = 0; x < w; x++) {
    let darkCount = 0;
    const startY = 600;
    const endY = 1000;
    const total = endY - startY;
    
    for (let y = startY; y < endY; y++) {
      const idx = (y * w + x) * channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const brightness = (r + g + b) / 3;
      if (brightness < 180) {
        darkCount++;
      }
    }
    
    if (darkCount / total > 0.8) {
      verticalLines.push(x);
    }
  }
  
  console.log('Vertical lines at x-coordinates:', verticalLines);
}

async function main() {
  await checkTemplate('facture-template.png');
  await checkTemplate('facture-template-chimiral.png');
  await checkTemplate('bon-livraison-template.png');
}

main().catch(console.error);
