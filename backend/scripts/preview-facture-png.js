const path = require('path');
const fs = require('fs');

require('ts-node/register');
const { generateFactureVentePdf } = require('../src/common/facture-pdf.generator');
const { calculerFactureVente } = require('../src/common/facture.utils');

const data = {
  numeroFacture: '2026/023',
  dateFacture: '2026-04-13',
  telephone: '0662 176 292',
  mail: 'contact@oxyral.ma',
  clientNom: 'PRIMARIOS',
  clientAdresse: 'CASABLANCA 20270 NEARSHORE PARK MOROCCO SHORE 10, N°401 02 502 1100 BD AL QODS , SIDI MAAROUD CASABLANCA',
  clientIce: '001529775000033',
  codeClient: 'OX704',
  bonCommande: 'GT/202600213',
  numeroAttach: '26/023',
  conditionPaiement: 'VIREMENT',
};

const t = calculerFactureVente([
  {
    designation:
      'REVETEMENT DU SOL INDUSTRIEL EN RESINE EPOXY SYSTEL MULTICOUCHE AUTO LISSANT ET ANTIDERAPANT',
    quantite: 250,
    prixUnitaire: 350,
  },
]);

async function run() {
  const pdfPath = path.join(__dirname, '../storage/pdfs/factures/vente/demo-primarios.pdf');
  const pngPath = path.join(__dirname, '../assets/facture-preview-demo.png');

  // Generate PDF using main code
  await generateFactureVentePdf({ ...data, ...t }, pdfPath);
  console.log('PDF demo generated at:', pdfPath);

  // Convert PDF to PNG
  const { pdf } = await import('pdf-to-img');
  let i = 0;
  for await (const img of await pdf(pdfPath, { scale: 1.5 })) {
    fs.writeFileSync(pngPath, img);
    console.log('PNG preview written to:', pngPath);
    break; // We only need the first page
  }
}

run().catch(console.error);
