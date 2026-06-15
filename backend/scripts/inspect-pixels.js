const sharp = require('sharp');
const path = require('path');

async function run() {
  const imgPath = path.join(__dirname, '../assets/facture-template.png');
  const image = sharp(imgPath);
  const metadata = await image.metadata();
  console.log('Dimensions:', metadata.width, 'x', metadata.height);

  const { data, info } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });

  const sampleX = 700;
  const sampleY = 350;
  const channels = info.channels;
  const idx = (sampleY * info.width + sampleX) * channels;
  const r = data[idx];
  const g = data[idx + 1];
  const b = data[idx + 2];
  console.log(`Pixel at (${sampleX}, ${sampleY}): RGB(${r}, ${g}, ${b})`);

  const samples = [
    [100, 100], // top-left
    [500, 800], // middle
    [900, 1300], // bottom-right
  ];
  for (const [x, y] of samples) {
    const i = (y * info.width + x) * channels;
    console.log(`Pixel at (${x}, ${y}): RGB(${data[i]}, ${data[i+1]}, ${data[i+2]})`);
  }
}

run().catch(console.error);
