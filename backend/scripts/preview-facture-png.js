const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Import TS files directly
require('ts-node/register');
const { generateFactureVentePdf } = require('../src/common/facture-pdf.generator');
const { calculerFactureVente } = require('../src/common/facture.utils');

// We will temporarily patch/copy the generation logic to output a PNG
const TEMPLATE = path.join(__dirname, '..', 'assets', 'facture-template.png');
const OUT_PNG = path.join(__dirname, '..', 'assets', 'facture-preview-demo.png');

const data = {
  numeroFacture: '2026/023',
  dateFacture: '2026-04-13',
  telephone: '0662 176 292',
  mail: 'contact@oxyral.ma',
  clientNom: 'PRIMARIOS',
  clientAdresse: 'Hay hakam rue 92 tit mellil CASABLANCA',
  clientIce: '001529775000033',
  codeClient: 'OX704',
  bonCommande: 'GT/202600213',
  numeroAttach: '26/023',
  rib: 'SG 022 780 000 024 00 060 756 80 74',
};

const t = calculerFactureVente([
  {
    designation:
      'REVETEMENT DU SOL INDUSTRIEL EN RESINE EPOXY SYSTEL MULTICOUCHE AUTO LISSANT ET ANTIDERAPANT',
    quantite: 250,
    prixUnitaire: 350,
  },
]);

// Let's run a modified version that outputs the PNG
async function run() {
  const merged = { ...data, ...t };
  
  // We re-use coordinates from the generator
  const F = {
    date: { x: 380, y: 134 },
    numero: { x: 570, y: 134 },
    telephone: { x: 145, y: 278 },
    mail: { x: 110, y: 299 },
    client: {
      x: 380,
      w: 340,
      yNom: 221,
      yAdr1: 249,
      yVille: 271,
      xIce: 425,
      wIce: 215,
      yIce: 283,
    },
    codeClient: { x: 46, y: 364, w: 131 },
    bonCommande: { x: 177, y: 364, w: 156 },
    numeroAttach: { x: 333, y: 364, w: 133 },
    rib: { x: 466, y: 364, w: 254 },
    table: {
      y0: 438,
      step: 28,
      maxRows: 12,
      designation: { x: 128, w: 287 },
      qte: { x: 421, w: 80 },
      puHt: { x: 507, w: 82 },
      montantHt: { x: 595, w: 119 },
    },
    totalHorsTaxe: { x: 595, y: 696, w: 119 },
    totalHt: { x: 46, y: 790, w: 224 },
    totalTva: { x: 270, y: 790, w: 235 },
    totalTtc: { x: 505, y: 790, w: 215 },
    montantLettres: { x: 320, y: 885, w: 390 },
  };

  function esc(text) {
    return (text || '')
      .replace(/[\u202f\u00a0]/g, ' ')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function svgText(text, x, y, opts = {}) {
    if (!text) return '';
    const size = opts.size ?? 11;
    const anchor = opts.anchor ?? 'start';
    let px = x;
    if (anchor === 'middle' && opts.width) px = x + opts.width / 2;
    if (anchor === 'end') px = x;
    return `<text x="${px}" y="${y + size}" font-family="Arial,Helvetica,sans-serif" font-size="${size}" font-weight="${opts.weight ?? 'normal'}" text-anchor="${anchor}" fill="#1a1a1a">${esc(text)}</text>`;
  }

  function svgBox(text, x, y, w, size = 11, weight = 'normal') {
    return svgText(text, x, y, { size, weight, anchor: 'middle', width: w });
  }

  const { formatDateFacture, formatMontantFacture } = require('../src/common/facture.utils');

  const parts = [];
  
  // splitClientAdresse
  const trimmed = merged.clientAdresse.trim();
  const sep = trimmed.split(/\s*[—–-]\s*/);
  let ligne1 = trimmed;
  let ville = '';
  if (sep.length >= 2) {
    ligne1 = sep[0].trim();
    ville = sep.slice(1).join(' ').trim();
  } else {
    const partsAddress = trimmed.split(/\s+/);
    const last = partsAddress[partsAddress.length - 1];
    if (partsAddress.length > 1 && last === last.toUpperCase() && last.length >= 3) {
      ligne1 = partsAddress.slice(0, -1).join(' ');
      ville = last;
    }
  }

  parts.push(svgText(formatDateFacture(merged.dateFacture), F.date.x, F.date.y, { size: 11 }));
  parts.push(svgText(merged.numeroFacture, F.numero.x, F.numero.y, { size: 11 }));

  if (merged.telephone) {
    parts.push(svgText(merged.telephone, F.telephone.x, F.telephone.y, { size: 11 }));
  }
  if (merged.mail) {
    parts.push(svgText(merged.mail, F.mail.x, F.mail.y, { size: 11 }));
  }

  parts.push(
    svgBox(merged.clientNom.toUpperCase(), F.client.x, F.client.yNom, F.client.w, 11, 'bold'),
  );
  if (ligne1) {
    parts.push(
      svgBox(ligne1.toUpperCase(), F.client.x, F.client.yAdr1, F.client.w, 11, 'bold'),
    );
  }
  if (ville) {
    parts.push(
      svgBox(ville.toUpperCase(), F.client.x, F.client.yVille, F.client.w, 13, 'bold'),
    );
  }
  if (merged.clientIce) {
    parts.push(svgBox(merged.clientIce, F.client.xIce, F.client.yIce, F.client.wIce, 11));
  }

  parts.push(svgBox(merged.codeClient, F.codeClient.x, F.codeClient.y, F.codeClient.w));
  if (merged.bonCommande) {
    parts.push(svgBox(merged.bonCommande, F.bonCommande.x, F.bonCommande.y, F.bonCommande.w));
  }
  if (merged.numeroAttach) {
    parts.push(svgBox(merged.numeroAttach, F.numeroAttach.x, F.numeroAttach.y, F.numeroAttach.w));
  }
  if (merged.rib) {
    parts.push(svgBox(merged.rib, F.rib.x, F.rib.y, F.rib.w, 9));
  }

  // Draw first row of table
  let rowY = F.table.y0;
  for (const ligne of merged.lignes.slice(0, F.table.maxRows)) {
    // wrapDesignation
    const words = ligne.designation.split(/\s+/);
    const lines = [];
    let current = '';
    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (next.length > 38 && current) {
        lines.push(current);
        current = word;
      } else {
        current = next;
      }
    }
    if (current) lines.push(current);
    const descLines = lines.slice(0, 4);

    descLines.forEach((line, i) => {
      parts.push(
        svgText(line, F.table.designation.x, rowY + i * 12, { size: 10 }),
      );
    });

    const numY = rowY + Math.max(0, (descLines.length - 1) * 6);
    parts.push(
      svgText(formatMontantFacture(ligne.quantite), F.table.qte.x + F.table.qte.w, numY, {
        anchor: 'end',
        size: 10,
      }),
    );
    parts.push(
      svgText(formatMontantFacture(ligne.prixUnitaire), F.table.puHt.x + F.table.puHt.w, numY, {
        anchor: 'end',
        size: 10,
      }),
    );
    parts.push(
      svgText(formatMontantFacture(ligne.montantHt), F.table.montantHt.x + F.table.montantHt.w, numY, {
        anchor: 'end',
        size: 10,
      }),
    );
    rowY += Math.max(F.table.step, descLines.length * 14);
  }

  parts.push(
    svgText(
      formatMontantFacture(merged.totalHt),
      F.totalHorsTaxe.x + F.totalHorsTaxe.w,
      F.totalHorsTaxe.y,
      { anchor: 'end', size: 10, weight: 'bold' },
    ),
  );
  parts.push(
    svgBox(formatMontantFacture(merged.totalHt), F.totalHt.x, F.totalHt.y, F.totalHt.w, 11, 'bold'),
  );
  parts.push(
    svgBox(formatMontantFacture(merged.totalTva), F.totalTva.x, F.totalTva.y, F.totalTva.w, 11, 'bold'),
  );
  parts.push(
    svgBox(formatMontantFacture(merged.totalTtc), F.totalTtc.x, F.totalTtc.y, F.totalTtc.w, 11, 'bold'),
  );
  parts.push(
    svgText(merged.montantEnLettres, F.montantLettres.x, F.montantLettres.y, {
      size: 10,
      weight: 'bold',
    }),
  );

  const svg = `<svg width="768" height="1024" xmlns="http://www.w3.org/2000/svg">${parts.join('')}</svg>`;
  await sharp(TEMPLATE)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toFile(OUT_PNG);
  
  console.log('PNG preview written to:', OUT_PNG);
}

run().catch(console.error);
