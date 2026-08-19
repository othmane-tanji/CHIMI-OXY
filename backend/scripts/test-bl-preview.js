const path = require('path');
const fs = require('fs');

require('ts-node/register');
const { generateFactureVentePdf } = require('../src/common/facture-pdf.generator');
const { calculerFactureVente } = require('../src/common/facture.utils');

const oxyralData = {
  numeroFacture: '2026/023',
  dateFacture: '2026-04-13',
  telephone: '0662 176 292',
  mail: 'contact@oxyral.ma',
  clientNom: 'MARJANE HOLDING S.A.',
  clientAdresse: 'CASABLANCA 20270 NEARSHORE PARK MOROCCO SHORE 10, N°401 02 502 1100 BD AL QODS , SIDI MAAROUD CASABLANCA',
  clientIce: '001529775000033',
  codeClient: 'OX704',
  bonCommande: 'GT/202600213',
  numeroAttach: 'Transporteur GLS', // Mode de livraison in the Attach. box!
  conditionPaiement: 'VIREMENT',
  chantier: 'Tanger',
  societe: 'OXYRAL',
};

const chimiralData = {
  numeroFacture: '2026/012',
  dateFacture: '2026-06-15',
  telephone: '05 22 33 29 05',
  mail: 'chimiral@oxyral.ma',
  clientNom: 'NESTLE MAROC S.A',
  clientAdresse: '402 502 1100 BD, SIDI MAAROUD CASABLANCA',
  clientIce: '001589293000046',
  codeClient: 'CH704',
  bonCommande: 'BC-998877',
  numeroAttach: 'Livré par nos soins', // Mode de livraison
  conditionPaiement: 'CHÈQUE',
  societe: 'CHIMIRAL',
};

const items = [
  {
    designation: 'PRESTATION D\'APPLICATION DE PEINTURE SUR SURFACES MURALES ET STRUCTURES METALLIQUES',
    quantite: 1500,
    prixUnitaire: 45,
  },
  {
    designation: 'REVETEMENT DU SOL INDUSTRIEL EN RESINE EPOXY SYSTEL MULTICOUCHE AUTO LISSANT ET ANTIDERAPANT',
    quantite: 250,
    prixUnitaire: 350,
  }
];

async function run() {
  const assetsDir = path.join(__dirname, '../../artifacts/scratch');
  fs.mkdirSync(assetsDir, { recursive: true });

  const oxyralPdfPath = path.join(__dirname, '../storage/pdfs/factures/vente/test-bl-oxyral.pdf');
  const oxyralPngPath = path.join(assetsDir, 'test-bl-oxyral-preview.png');
  const tOxy = calculerFactureVente(items);

  console.log('Generating OXYRAL BL PDF...');
  await generateFactureVentePdf({ ...oxyralData, ...tOxy, isBl: true }, oxyralPdfPath);
  console.log('OXYRAL BL PDF generated.');

  const chimiralPdfPath = path.join(__dirname, '../storage/pdfs/factures/vente/test-bl-chimiral.pdf');
  const chimiralPngPath = path.join(assetsDir, 'test-bl-chimiral-preview.png');
  const tChim = calculerFactureVente(items);

  console.log('Generating CHIMIRAL BL PDF...');
  await generateFactureVentePdf({ ...chimiralData, ...tChim, isBl: true }, chimiralPdfPath);
  console.log('CHIMIRAL BL PDF generated.');

  // Convert PDFs to PNGs
  const { pdf } = await import('pdf-to-img');
  
  console.log('Converting OXYRAL BL PDF to PNG...');
  for await (const img of await pdf(oxyralPdfPath, { scale: 1.5 })) {
    fs.writeFileSync(oxyralPngPath, img);
    console.log('OXYRAL PNG written to:', oxyralPngPath);
    break;
  }

  console.log('Converting CHIMIRAL BL PDF to PNG...');
  for await (const img of await pdf(chimiralPdfPath, { scale: 1.5 })) {
    fs.writeFileSync(chimiralPngPath, img);
    console.log('CHIMIRAL PNG written to:', chimiralPngPath);
    break;
  }
}

run().catch(console.error);
