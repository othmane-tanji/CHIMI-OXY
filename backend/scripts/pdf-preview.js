const fs = require('fs');
const path = require('path');

async function main() {
  const { pdf } = await import('pdf-to-img');
  const pdfPath = path.join(__dirname, '..', 'assets', 'test-bulletin.pdf');
  let i = 0;
  for await (const img of await pdf(pdfPath, { scale: 2 })) {
    fs.writeFileSync(path.join(__dirname, '..', 'assets', `test-bulletin-preview-${i++}.png`), img);
  }
  console.log('preview ok');
}

main().catch(console.error);
