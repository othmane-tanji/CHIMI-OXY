const { pdf } = require('pdf-to-img');
const fs = require('fs');
const path = require('path');

const pdfPath = 'C:/Users/othaad/.gemini/antigravity/brain/bef1dcbb-6b65-40b1-a37e-4b90414b89dd/media__1782904854178.pdf';
const outputDir = path.join(__dirname, '..', 'assets');

async function run() {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`Converting PDF: ${pdfPath}...`);
  
  let pageNum = 1;
  const converter = await pdf(pdfPath, {
    scale: 2.0 // Make it high quality
  });
  
  for await (const page of converter) {
    const outputPath = path.join(outputDir, `devis-template-page${pageNum}.png`);
    fs.writeFileSync(outputPath, page);
    console.log(`Saved: page ${pageNum} -> ${outputPath}`);
    pageNum++;
  }
  
  console.log('PDF conversion finished successfully!');
}

run().catch(console.error);
