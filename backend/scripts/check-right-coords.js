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

  // Let's scan vertical line at x = 800 to find borders on the right
  const x = 800;
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
  
  console.log(`Borders crossed by vertical line at x=800:`, verticalLines);
}

main().catch(console.error);
