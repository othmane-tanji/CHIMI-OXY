/** Preview PNG — node scripts/preview-facture-demo.js */
const path = require('path');
require('ts-node/register');
const { generateFactureVentePdf } = require('../src/common/facture-pdf.generator');
const { calculerFactureVente } = require('../src/common/facture.utils');
const sharp = require('sharp');
const fs = require('fs');

const data = {
  numeroFacture: '2026/023',
  dateFacture: '2026-04-13',
  telephone: '0662 176 292',
  mail: 'contact@oxyral.ma',
  clientNom: 'PRIMARIOS',
  clientAdresse: 'Hay hakam riue 92 da 82 tit mellil CASABLANCA',
  clientIce: '00152977500033',
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

generateFactureVentePdf(
  { ...data, ...t },
  path.join(__dirname, '../storage/pdfs/factures/vente/demo-primarios.pdf'),
).then(() => console.log('PDF demo OK'));
