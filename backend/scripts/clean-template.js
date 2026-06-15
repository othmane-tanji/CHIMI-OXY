const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function cleanImage(inputPath, outputPath) {
  const image = sharp(inputPath);
  const { data, info } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;
  const length = data.length;

  for (let i = 0; i < length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // If all channels are very close to white, make them pure white
    if (r > 235 && g > 235 && b > 235) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
    }
  }

  await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: info.channels,
    }
  })
  .png()
  .toFile(outputPath);

  console.log(`Cleaned image saved to: ${outputPath}`);
}

async function run() {
  const assetsDir = path.join(__dirname, '../assets');

  // Clean Chimiral template
  const chimiralInput = path.join(assetsDir, 'facture-template-chimiral.png');
  const chimiralOutput = path.join(assetsDir, 'facture-template-chimiral.png'); // Overwrite directly
  // Create backup first
  fs.copyFileSync(chimiralInput, chimiralInput + '.bak');
  await cleanImage(chimiralInput, chimiralOutput);

  // Clean Oxyral template
  const oxyralInput = path.join(assetsDir, 'facture-template.png');
  const oxyralOutput = path.join(assetsDir, 'facture-template.png'); // Overwrite directly
  // Create backup first
  fs.copyFileSync(oxyralInput, oxyralInput + '.bak');
  await cleanImage(oxyralInput, oxyralOutput);
}

run().catch(console.error);
