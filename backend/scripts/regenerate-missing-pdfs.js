const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { generateBulletinPaiePdf } = require('../dist/src/common/bulletin-pdf.generator');

async function getCumuls(prisma, bulletin) {
  const precedents = await prisma.bulletinPaie.findMany({
    where: { employeId: bulletin.employeId, annee: bulletin.annee, mois: { lt: bulletin.mois } },
  });
  const current = {
    salaireBrut: Number(bulletin.salaireBrut),
    deductions: Number(bulletin.deductions),
    cnss: Number(bulletin.cnss),
    amo: Number(bulletin.amo),
    ir: Number(bulletin.ir),
    nombreJours: bulletin.nombreJours,
  };
  const cumulBrut = precedents.reduce((s, b) => s + Number(b.salaireBrut), 0) + current.salaireBrut;
  const cumulRetenues = precedents.reduce((s, b) => s + Number(b.deductions), 0) + current.deductions;
  const cumulDeductions =
    precedents.reduce((s, b) => s + Number(b.cnss) + Number(b.amo), 0) + current.cnss + current.amo;
  const cumulIr = precedents.reduce((s, b) => s + Number(b.ir), 0) + current.ir;
  const joursIr = precedents.reduce((s, b) => s + b.nombreJours, 0) + current.nombreJours;
  return { joursIr, cumulBaseImposable: cumulBrut, cumulRetenues, cumulDeductions, cumulRetenuesIr: cumulIr };
}

async function main() {
  const prisma = new PrismaClient();
  const bulletins = await prisma.bulletinPaie.findMany({
    where: { pdfPath: null },
    include: { employe: true },
  });
  console.log(`${bulletins.length} bulletin(s) sans PDF`);
  const dir = path.join(process.cwd(), 'storage', 'pdfs', 'bulletins');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  for (const bulletin of bulletins) {
    const cumuls = await getCumuls(prisma, bulletin);
    const filename = `bulletin-${bulletin.employe.cin}-${bulletin.annee}-${String(bulletin.mois).padStart(2, '0')}.pdf`;
    const fullPath = path.join(dir, filename);
    await generateBulletinPaiePdf(bulletin, fullPath, cumuls);
    const pdfPath = path.relative(process.cwd(), fullPath).replace(/\\/g, '/');
    await prisma.bulletinPaie.update({ where: { id: bulletin.id }, data: { pdfPath } });
    console.log(`Bulletin #${bulletin.id} -> ${pdfPath}`);
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
