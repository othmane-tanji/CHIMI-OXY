const path = require('path');
const fs = require('fs');
const { generateBulletinPaiePdf } = require('../backend/dist/common/bulletin-pdf.generator');

async function test() {
  const dummyBulletin = {
    id: 1,
    mois: 1,
    annee: 2026,
    salaireBase: 12000,
    nombreJours: 26,
    joursAbsents: 0,
    tauxJournalier: 461.54,
    montantAppointements: 12000,
    tauxAnciennete: 5,
    montantAnciennete: 600,
    salaireBrut: 12600,
    primes: 0,
    cnss: 564.48,
    amo: 284.76,
    ir: 1250,
    indemniteTransport: 150,
    deductions: 2099.24,
    salaireNet: 10650.76,
    datePaie: new Date(),
    employe: {
      id: 1,
      nom: 'EL MANSOURI',
      prenom: 'Youssef',
      fonction: 'Responsable Technique',
      cin: 'AB123456',
      cnss: '123456789',
      cimr: '987654',
      dateEmbauche: '2022-03-15',
      situationFamiliale: 'MARIE',
      nombreEnfants: 2,
      adresse: '123 Boulevard Zerktouni, Casablanca',
      societe: 'CHIMIRAL',
    },
  };

  const cumuls = {
    joursIr: 26,
    cumulBaseImposable: 12600,
    cumulRetenues: 2099.24,
    cumulDeductions: 849.24,
    cumulRetenuesIr: 1250,
  };

  const outPath = path.join(__dirname, 'test-bulletin-out.pdf');
  console.log('Generating test payslip PDF to:', outPath);
  await generateBulletinPaiePdf(dummyBulletin, outPath, cumuls);
  console.log('PDF generated successfully! File size:', fs.statSync(outPath).size, 'bytes');
}

test().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
