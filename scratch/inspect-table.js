const sharp = require('sharp');
const path = require('path');

async function main() {
  const imgPath = path.join(__dirname, '../backend/assets/facture-template.png');
  const { data, info } = await sharp(imgPath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const channels = info.channels;

  // Let's find horizontal lines.
  // A horizontal line at y is a line where at least 80% of pixels between x=60 and x=1020 are dark (average RGB < 180)
  console.log(`Image dimensions: ${w}x${h}`);
  
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

main().catch(console.error);
