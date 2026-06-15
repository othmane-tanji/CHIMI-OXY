const path = require('path');
const fs = require('fs');

require('ts-node/register');
const { generateFactureVentePdf } = require('../src/common/facture-pdf.generator');
const { calculerFactureVente } = require('../src/common/facture.utils');

const data = {
  numeroFacture: '2026/012',
  dateFacture: '2026-06-15',
  telephone: '05 22 33 29 05',
  mail: 'chimiral@oxyral.ma',
  clientNom: 'NESTLE MAROC S.A',
  clientAdresse: '402 502 1100 BD, SIDI MAAROUD CASABLANCA',
  clientIce: '001589293000046',
  codeClient: 'CH704',
  bonCommande: 'BC-998877',
  numeroAttach: '26/012',
  conditionPaiement: 'CHÈQUE',
  societe: 'CHIMIRAL',
};

const t = calculerFactureVente([
  {
    designation: 'PRESTATION D\'APPLICATION DE PEINTURE SUR SURFACES MURALES ET STRUCTURES METALLIQUES',
    quantite: 1500,
    prixUnitaire: 45,
  },
]);

async function run() {
  const pdfPath = path.join(__dirname, '../storage/pdfs/factures/vente/demo-chimiral.pdf');
  const pngPath = path.join(__dirname, '../assets/facture-chimiral-preview-demo.png');

  // Generate PDF using main code
  await generateFactureVentePdf({ ...data, ...t, montantEnLettres: 'SOIXANTE-SEPT MILLE CINQ CENTS DIRHAMS ET 00 CTS.' }, pdfPath);
  console.log('PDF demo generated at:', pdfPath);

  // Convert PDF to PNG
  const { pdf } = await import('pdf-to-img');
  for await (const img of await pdf(pdfPath, { scale: 1.5 })) {
    fs.writeFileSync(pngPath, img);
    console.log('PNG preview written to:', pngPath);
    break; // We only need the first page
  }
}

run().catch(console.error);
