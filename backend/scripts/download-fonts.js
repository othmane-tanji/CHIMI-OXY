const fs = require('fs');
const path = require('path');

const FONTS = {
  MontserratRegular: 'https://raw.githubusercontent.com/JulietaUla/Montserrat/master/fonts/ttf/Montserrat-Regular.ttf',
  MontserratBold: 'https://raw.githubusercontent.com/JulietaUla/Montserrat/master/fonts/ttf/Montserrat-Bold.ttf',
  PoppinsRegular: 'https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-Regular.ttf',
  PoppinsBold: 'https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-Bold.ttf',
};

async function main() {
  const assetsDir = path.join(__dirname, '../assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  const fontData = {};

  for (const [name, url] of Object.entries(FONTS)) {
    console.log(`Downloading ${name} from ${url}...`);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fontData[name] = buffer.toString('base64');
      console.log(`Successfully downloaded and encoded ${name} (${buffer.length} bytes)`);
    } catch (err) {
      console.error(`Error downloading ${name}:`, err.message);
    }
  }

  const outputPath = path.join(assetsDir, 'fonts.json');
  fs.writeFileSync(outputPath, JSON.stringify(fontData, null, 2));
  console.log(`Saved base64 fonts to ${outputPath}`);
}

main().catch(console.error);
