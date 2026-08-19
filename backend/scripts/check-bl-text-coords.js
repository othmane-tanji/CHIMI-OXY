const sharp = require('sharp');
const path = require('path');

async function main() {
  const imgPath = path.join(__dirname, '../assets/bon-livraison-template.png');
  const { data, info } = await sharp(imgPath)
    .resize(1086, 1448)
    .raw()
    .toBuffer({ resolveWithObject: true });
    
  const w = info.width;
  const h = info.height;
  const channels = info.channels;

  // Let's find horizontal line y-positions inside the header and client areas
  // 1. Scan vertical line at x = 100 to find box borders (y)
  const x = 100;
  const verticalLines = [];
  let inLine = false;
  let lineStart = 0;
  for (let y = 0; y < h; y++) {
    const idx = (y * w + x) * channels;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const brightness = (r + g + b) / 3;
    
    if (brightness < 180) {
      if (!inLine) {
        inLine = true;
        lineStart = y;
      }
    } else {
      if (inLine) {
        inLine = false;
        verticalLines.push(Math.round((lineStart + y - 1) / 2));
      }
    }
  }
  
  console.log(`Borders crossed by vertical line at x=100:`, verticalLines);

  // Let's scan a vertical line inside the code client block at x = 150 to find the y-coordinates of code client box
  const xBox = 150;
  const boxLines = [];
  inLine = false;
  for (let y = 450; y < 650; y++) {
    const idx = (y * w + xBox) * channels;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const brightness = (r + g + b) / 3;
    
    if (brightness < 180) {
      if (!inLine) {
        inLine = true;
        lineStart = y;
      }
    } else {
      if (inLine) {
        inLine = false;
        boxLines.push(Math.round((lineStart + y - 1) / 2));
      }
    }
  }
  console.log(`Borders crossed in the Code Client region (x=150, y from 450 to 650):`, boxLines);
}

main().catch(console.error);
