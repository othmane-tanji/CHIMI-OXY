const sharp = require('sharp');
const path = require('path');

async function main() {
  const imgPath = path.join(__dirname, '../assets/bon-livraison-template.png');
  
  // Resize to 1086x1448 to match the working coordinate space of our PDF generator
  const { data, info } = await sharp(imgPath)
    .resize(1086, 1448)
    .raw()
    .toBuffer({ resolveWithObject: true });
    
  const w = info.width;
  const h = info.height;
  const channels = info.channels;

  console.log(`Analyzing resized image: ${w}x${h}`);

  // Let's scan a horizontal line inside the table area at y = 800
  const y = 800;
  const rowStart = y * w * channels;
  
  // Find all dark vertical line centers (average RGB < 180)
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
        const lineCenter = Math.round((lineStart + x - 1) / 2);
        darkPositions.push(lineCenter);
      }
    }
  }
  
  console.log(`Detected vertical lines at x-coordinates at y=800:`, darkPositions);
}

main().catch(console.error);
