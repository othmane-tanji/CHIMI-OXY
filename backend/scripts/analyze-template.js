const sharp = require('sharp');
const path = require('path');

async function main() {
  const imgPath = path.join(__dirname, '..', 'assets', 'facture-template.png');
  const image = sharp(imgPath);
  const metadata = await image.metadata();
  const { width, height } = metadata;
  const raw = await image.raw().toBuffer();

  function getRGB(x, y) {
    const idx = (y * width + x) * 3;
    if (idx >= raw.length) return null;
    return { r: raw[idx], g: raw[idx + 1], b: raw[idx + 2] };
  }

  function isNonWhite(x, y) {
    const rgb = getRGB(x, y);
    if (!rgb) return false;
    // Threshold to consider a pixel non-white
    return rgb.r < 230 || rgb.g < 230 || rgb.b < 230;
  }

  // Find horizontal lines (rows with > 10% non-white pixels)
  const horizRows = [];
  for (let y = 0; y < height; y++) {
    let count = 0;
    for (let x = 0; x < width; x++) {
      if (isNonWhite(x, y)) count++;
    }
    const pct = count / width;
    if (pct > 0.15) { // 15% of the row is non-white
      horizRows.push({ y, pct });
    }
  }

  // Group adjacent rows
  let groupedRows = [];
  if (horizRows.length > 0) {
    let current = [horizRows[0]];
    for (let i = 1; i < horizRows.length; i++) {
      if (horizRows[i].y - horizRows[i-1].y <= 5) {
        current.push(horizRows[i]);
      } else {
        const avgY = Math.round(current.reduce((sum, r) => sum + r.y, 0) / current.length);
        groupedRows.push(avgY);
        current = [horizRows[i]];
      }
    }
    const avgY = Math.round(current.reduce((sum, r) => sum + r.y, 0) / current.length);
    groupedRows.push(avgY);
  }
  console.log('Horizontal lines (Y coordinates):', groupedRows);

  // Find vertical lines (columns with > 5% non-white pixels)
  // But let's only look in the vertical range where table/boxes are (y = 150 to 950)
  const vertCols = [];
  for (let x = 0; x < width; x++) {
    let count = 0;
    for (let y = 150; y < 950; y++) {
      if (isNonWhite(x, y)) count++;
    }
    const pct = count / (950 - 150);
    if (pct > 0.08) { // 8% of column is non-white
      vertCols.push({ x, pct });
    }
  }

  let groupedCols = [];
  if (vertCols.length > 0) {
    let current = [vertCols[0]];
    for (let i = 1; i < vertCols.length; i++) {
      if (vertCols[i].x - vertCols[i-1].x <= 5) {
        current.push(vertCols[i]);
      } else {
        const avgX = Math.round(current.reduce((sum, c) => sum + c.x, 0) / current.length);
        groupedCols.push(avgX);
        current = [vertCols[i]];
      }
    }
    const avgX = Math.round(current.reduce((sum, c) => sum + c.x, 0) / current.length);
    groupedCols.push(avgX);
  }
  console.log('Vertical lines (X coordinates):', groupedCols);
}

main().catch(console.error);
