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

  function scanRow(y) {
    const rowStart = y * w * channels;
    const darkPositions = [];
    let inLine = false;
    let lineStart = 0;
    
    for (let x = 0; x < w; x++) {
      const idx = rowStart + x * channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const brightness = (r + g + b) / 3;
      
      if (brightness < 180) {
        if (!inLine) {
          inLine = true;
          lineStart = x;
        }
      } else {
        if (inLine) {
          inLine = false;
          darkPositions.push(Math.round((lineStart + x - 1) / 2));
        }
      }
    }
    return darkPositions;
  }

  console.log('Top-right box borders (y=138):', scanRow(138));
  console.log('Client box borders (y=300):', scanRow(300));
  console.log('4 boxes borders (y=593):', scanRow(593));
}

main().catch(console.error);
