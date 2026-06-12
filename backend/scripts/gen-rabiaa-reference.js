const path = require('path');
const { generateBulletinPaiePdf } = require('../dist/src/common/bulletin-pdf.generator');

/** Données identiques à l'exemple RABIAA IMAD fourni par l'utilisateur */
const bulletin = {
  mois: 4,
  annee: 2026,
  nombreJours: 23,
  tauxJournalier: 131.653,
  montantAppointements: 3028.04,
  tauxAnciennete: 5,
  montantAnciennete: 151.4,
  salaireBrut: 3179.44,
  primes: 0,
  cnss: 142.44,
  amo: 71.86,
  ir: 0,
  indemniteTransport: 150,
  deductions: 214.69,
  salaireNet: 3115.14,
  datePaie: new Date('2026-05-05'),
  employe: {
    id: 3,
    nom: 'RABIAA',
    prenom: 'IMAD',
    adresse: 'DR OULD SIDI ABDENBI CHELLALATE MOHAMMEDIA',
    dateNaissance: new Date('1992-03-23'),
    dateEmbauche: new Date('2021-07-01'),
    situationFamiliale: 'Marié(e)',
    nombreEnfants: 3,
    cin: 'T264269',
    cnss: '17624025',
    cimr: '',
  },
};

async function main() {
  const out = path.join(__dirname, '..', 'assets', 'test-rabiaa-reference.pdf');
  await generateBulletinPaiePdf(bulletin, out, {
    joursIr: 23,
    cumulBaseImposable: 7892.58,
    cumulRetenues: 913.09,
    cumulDeductions: 565.38,
    cumulRetenuesIr: 0,
  });
  console.log('PDF référence généré:', out);
}

main().catch(console.error);
