const fs = require('fs');
const path = require('path');

async function main() {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const data = new Uint8Array(
    fs.readFileSync(path.join(__dirname, '..', 'assets', 'bulletin-modele.pdf')),
  );
  const doc = await pdfjs.getDocument({ data }).promise;
  const page = await doc.getPage(1);
  const ops = await page.getOperatorList();
  console.log('ops', ops.fnArray.length);
}

main().catch(console.error);
