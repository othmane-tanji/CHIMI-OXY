const sharp = require('sharp');
const path = require('path');

async function main() {
  const imgPath = path.join(__dirname, '../artifacts/scratch/test-bl-oxyral-preview.png');
  // Wait, let's look at the local copy in the workspace
  const localImgPath = path.join(__dirname, '../../artifacts/scratch/test-bl-oxyral-preview.png');
  
  const { data, info } = await sharp(localImgPath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const channels = info.channels;

  console.log(`Analyzing image: ${localImgPath} (${w}x${h})`);

  // Let's scan a vertical line at x = 200 (which goes through the TOTAL HT box and label)
  // from y = 1050 to y = 1440
  const x = 200;
  console.log(`Scan at x = ${x}:`);
  for (let y = 1050; y < 1440; y += 5) {
    const idx = (y * w + x) * channels;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    
    // Check if it's not white (r < 240 or g < 240 or b < 240)
    if (r < 240 || g < 240 || b < 240) {
      console.log(`At y = ${y}: RGB(${r}, ${g}, ${b}) - non-white`);
    }
  }
}

main().catch(console.error);
