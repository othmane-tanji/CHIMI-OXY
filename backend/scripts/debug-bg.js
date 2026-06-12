const sharp = require('sharp');
const path = require('path');

async function main() {
  const svg = `<svg width="1053" height="1381" xmlns="http://www.w3.org/2000/svg">
    <rect x="30" y="280" width="992" height="500" fill="white"/>
  </svg>`;
  await sharp(path.join(__dirname, '..', 'assets', 'template-ref.png'))
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toFile(path.join(__dirname, '..', 'assets', 'test-wipe.png'));
  console.log('test-wipe.png saved');
}

main();
