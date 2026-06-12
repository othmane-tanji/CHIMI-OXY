const { PrismaClient } = require('@prisma/client');
const { generateBulletinPaiePdf } = require('../dist/src/common/bulletin-pdf.generator');
const path = require('path');

async function main() {
  const prisma = new PrismaClient();
  const bulletin = await prisma.bulletinPaie.findFirst({ include: { employe: true } });
  if (!bulletin) {
    console.log('Aucun bulletin');
    return;
  }
  const out = path.join(__dirname, '..', 'assets', 'test-bulletin.pdf');
  await generateBulletinPaiePdf(bulletin, out, {
    joursIr: bulletin.nombreJours,
    cumulBaseImposable: Number(bulletin.salaireBrut),
    cumulRetenues: Number(bulletin.deductions),
    cumulDeductions: Number(bulletin.cnss) + Number(bulletin.amo),
    cumulRetenuesIr: Number(bulletin.ir),
  });
  console.log('PDF généré:', out);
  await prisma.$disconnect();
}

main().catch(console.error);
