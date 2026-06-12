/** Recadre la photo vierge utilisateur → template-form.png */
const sharp = require('sharp');
const path = require('path');

async function main() {
  const src = path.join(__dirname, '..', 'assets', 'template-vide.png');
  const out = path.join(__dirname, '..', 'assets', 'template-form.png');
  const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  let minx = w;
  let miny = h;
  let maxx = 0;
  let maxy = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      const v = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (v < 240) {
        if (x < minx) minx = x;
        if (y < miny) miny = y;
        if (x > maxx) maxx = x;
        if (y > maxy) maxy = y;
      }
    }
  }
  await sharp(src)
    .extract({ left: minx, top: miny, width: maxx - minx + 1, height: maxy - miny + 1 })
    .png()
    .toFile(out);
  console.log('template-form.png', maxx - minx + 1, 'x', maxy - miny + 1, 'from offset', minx, miny);
}

main().catch(console.error);
