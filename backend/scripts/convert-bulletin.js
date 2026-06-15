const sharp = require('sharp');
const path = require('path');

const srcJpg = 'C:\\Users\\othaad\\.gemini\\antigravity\\brain\\bef1dcbb-6b65-40b1-a37e-4b90414b89dd\\media__1781557966109.png';
const destPng = path.join(__dirname, '../assets/template-form.png');

async function run() {
  await sharp(srcJpg)
    .resize(723, 952)
    .png()
    .toFile(destPng);
  console.log('Successfully converted and replaced template-form.png');
}

run().catch(console.error);

