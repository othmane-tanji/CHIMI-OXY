import * as ExcelJS from 'exceljs';
import * as path from 'path';
import * as fs from 'fs';

export interface BlExcelData {
  numeroBl: string;
  dateFacture: Date | string;
  clientNom: string;
  clientIce?: string;
  codeClient?: string;
  bonCommande?: string;
  conditionPaiement?: string;
  modeLivraison?: string;
  chantier?: string;
  lignes: {
    code?: string;
    designation: string;
    quantite: number;
    prixUnitaire: number;
  }[];
}

export async function generateBlExcelBuffer(data: BlExcelData): Promise<Buffer> {
  const templatePath = path.join(process.cwd(), 'templates', 'BL_TEMPLATE.xlsx');

  const wb = new ExcelJS.Workbook();
  if (fs.existsSync(templatePath)) {
    await wb.xlsx.readFile(templatePath);
  }

  const targetSheetName = 'BL MARK TANGER CITY CENTER 115';
  let targetSheet = wb.getWorksheet(targetSheetName);

  if (!targetSheet) {
    targetSheet = wb.worksheets[0] || wb.addWorksheet('BL');
  }

  // Keep only the target sheet
  const sheetIdToKeep = targetSheet.id;
  const sheetsToRemove = wb.worksheets.filter((w) => w.id !== sheetIdToKeep);
  sheetsToRemove.forEach((w) => wb.removeWorksheet(w.id));

  const cleanNum = (data.numeroBl || '2026-001').replace(/[^a-zA-Z0-9-]/g, '-');
  targetSheet.name = `BL ${cleanNum}`.substring(0, 31);

  // Populate Header Info
  const dateFormatted = data.dateFacture
    ? new Date(data.dateFacture).toLocaleDateString('fr-FR')
    : new Date().toLocaleDateString('fr-FR');

  targetSheet.getCell('C14').value = `N° : ${data.numeroBl}`;
  targetSheet.getCell('E14').value = `Date : ${dateFormatted}`;

  targetSheet.getCell('C16').value = `Client : ${data.clientNom || ''}`;
  targetSheet.getCell('E16').value = `ICE : ${data.clientIce || ''}`;

  targetSheet.getCell('C18').value = `Code Client : ${data.codeClient || 'OX704'}`;
  targetSheet.getCell('E18').value = `N° BC : ${data.bonCommande || ''}`;

  targetSheet.getCell('C20').value = `Condition de paiement : ${data.conditionPaiement || '60 JRs de la réception de facture'}`;
  targetSheet.getCell('E20').value = `Mode de livraison : ${data.modeLivraison || 'Par nos soins'}`;

  // Clear example items from Row 25 to 33
  for (let r = 25; r <= 33; r++) {
    const row = targetSheet.getRow(r);
    row.getCell(2).value = null; // Code
    row.getCell(3).value = null; // Designation
    row.getCell(4).value = null; // Qte
    row.getCell(5).value = null; // PU
  }

  // Populate Lignes starting at Row 25
  const lignes = data.lignes || [];
  lignes.forEach((l, idx) => {
    const r = 25 + idx;
    const row = targetSheet.getRow(r);
    row.getCell(2).value = l.code || '';
    row.getCell(3).value = l.designation || '';
    row.getCell(4).value = l.quantite ? Number(l.quantite) : 0;
    row.getCell(5).value = l.prixUnitaire ? Number(l.prixUnitaire) : 0;
  });

  // Chantier at Row 34
  const chantierValue = data.chantier || data.clientNom;
  if (chantierValue) {
    targetSheet.getCell('C34').value = `Chantier ${chantierValue}`;
  }

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
