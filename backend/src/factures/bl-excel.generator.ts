import * as ExcelJS from 'exceljs';

export interface BlExcelData {
  numeroBl: string;
  dateFacture: Date | string;
  societe?: string;
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
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Beta ERP';

  const sheet = wb.addWorksheet('Bon de Livraison');

  // Configuration d'impression A4 100% sur 1 seule page et centré
  sheet.pageSetup = {
    paperSize: 9, // Format A4
    orientation: 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 1,
    horizontalCentered: true,
    margins: {
      left: 0.3,
      right: 0.3,
      top: 0.4,
      bottom: 0.4,
      header: 0.2,
      footer: 0.2,
    },
  };

  sheet.views = [{ showGridLines: true }];

  // Largeurs de colonnes optimisées :
  // Col B (12) : CODE / Code client
  // Col C (35) : N° BON COMMANDE (réduit) / Désignations
  // Col D (26) : Conditions de payement (élargi pour lisibilité 100%) / Qté
  // Col E (20) : Mode de livraison / Prix Unitaire
  sheet.getColumn('A').width = 3;
  sheet.getColumn('B').width = 12;
  sheet.getColumn('C').width = 35;
  sheet.getColumn('D').width = 26;
  sheet.getColumn('E').width = 20;

  const boxBorder = {
    top: { style: 'medium' as const, color: { argb: 'FF9CA3AF' } },
    left: { style: 'medium' as const, color: { argb: 'FF9CA3AF' } },
    bottom: { style: 'medium' as const, color: { argb: 'FF9CA3AF' } },
    right: { style: 'medium' as const, color: { argb: 'FF9CA3AF' } },
  };

  const thinBorder = {
    top: { style: 'thin' as const, color: { argb: 'FFD1D5DB' } },
    left: { style: 'thin' as const, color: { argb: 'FFD1D5DB' } },
    bottom: { style: 'thin' as const, color: { argb: 'FFD1D5DB' } },
    right: { style: 'thin' as const, color: { argb: 'FFD1D5DB' } },
  };

  const softFill = {
    type: 'pattern' as const,
    pattern: 'solid' as const,
    fgColor: { argb: 'FFF9FAFB' },
  };

  const headerFill = {
    type: 'pattern' as const,
    pattern: 'solid' as const,
    fgColor: { argb: 'FFF3F4F6' },
  };

  const isChimiral = (data.societe || 'OXYRAL') === 'CHIMIRAL';

  // 1. TOP RIGHT CADRE: "BON DE LIVRAISON"
  sheet.mergeCells('D2:E3');
  const blTitleCell = sheet.getCell('D2');
  blTitleCell.value = 'BON DE LIVRAISON';
  blTitleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF1F2937' } };
  blTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  blTitleCell.fill = headerFill;

  ['D2', 'E2', 'D3', 'E3'].forEach((addr) => {
    sheet.getCell(addr).border = boxBorder;
  });

  // Sub-box Date (D4)
  const dateFormatted = data.dateFacture
    ? new Date(data.dateFacture).toLocaleDateString('fr-FR')
    : new Date().toLocaleDateString('fr-FR');
  const dateCell = sheet.getCell('D4');
  dateCell.value = `Date: ${dateFormatted}`;
  dateCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF374151' } };
  dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
  dateCell.border = thinBorder;
  dateCell.fill = softFill;

  // Sub-box N° (E4)
  const numCell = sheet.getCell('E4');
  numCell.value = `N : ${data.numeroBl || ''}`;
  numCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF374151' } };
  numCell.alignment = { horizontal: 'center', vertical: 'middle' };
  numCell.border = thinBorder;
  numCell.fill = softFill;

  // 2. CADRE ENTREPRISE (B6:C11)
  sheet.mergeCells('B6:C11');
  const compCell = sheet.getCell('B6');
  compCell.value = isChimiral
    ? `CHIMIRAL SARL\n12 Rue Des Hopitaux\nCasablanca\nTéléphone : 05 22 33 29 05\nMail: chimiral@oxyral.ma`
    : `OXYRAL SARL\nZone Industriel TIT MELLIL\nCasablanca\nTéléphone : 0522 332 905\nFax       : 0522 329 062\nMail: oxyral2010@gmail.com`;
  compCell.font = { name: 'Calibri', size: 10, color: { argb: 'FF1F2937' } };
  compCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 1 };
  compCell.fill = softFill;

  for (let r = 6; r <= 11; r++) {
    sheet.getCell(`B${r}`).border = boxBorder;
    sheet.getCell(`C${r}`).border = boxBorder;
  }

  // 3. CADRE CLIENT (D6:E11)
  sheet.mergeCells('D6:E11');
  const clientCell = sheet.getCell('D6');
  const clientNom = (data.clientNom || '').toUpperCase();
  const clientIce = data.clientIce ? `ICE: ${data.clientIce}` : '';
  clientCell.value = `${clientNom}\n${clientIce}`;
  clientCell.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FF111827' } };
  clientCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  clientCell.fill = softFill;

  for (let r = 6; r <= 11; r++) {
    sheet.getCell(`D${r}`).border = boxBorder;
    sheet.getCell(`E${r}`).border = boxBorder;
  }

  // 4. CADRES DES 4 MÉTRIQUES (Rows 13 & 15)
  const headerFont = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF374151' } };
  const valFont = { name: 'Calibri', size: 9.5, color: { argb: 'FF111827' } };

  // Code client (B13 & B15)
  sheet.getCell('B13').value = 'Code client';
  sheet.getCell('B13').font = headerFont;
  sheet.getCell('B13').alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getCell('B13').border = thinBorder;
  sheet.getCell('B13').fill = headerFill;

  sheet.getCell('B15').value = data.codeClient || (isChimiral ? 'CH704' : '601');
  sheet.getCell('B15').font = valFont;
  sheet.getCell('B15').alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getCell('B15').border = thinBorder;
  sheet.getCell('B15').fill = softFill;

  // N° BON COMMANDE (C13 & C15 - Réduit)
  sheet.getCell('C13').value = 'N° BON COMMANDE';
  sheet.getCell('C13').font = headerFont;
  sheet.getCell('C13').alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getCell('C13').border = thinBorder;
  sheet.getCell('C13').fill = headerFill;

  sheet.getCell('C15').value = data.bonCommande || '';
  sheet.getCell('C15').font = valFont;
  sheet.getCell('C15').alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getCell('C15').border = thinBorder;
  sheet.getCell('C15').fill = softFill;

  // Conditions de payement (D13 & D15 - Élargi pour lisibilité 100%!)
  sheet.getCell('D13').value = 'Conditions de payement';
  sheet.getCell('D13').font = headerFont;
  sheet.getCell('D13').alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getCell('D13').border = thinBorder;
  sheet.getCell('D13').fill = headerFill;

  sheet.getCell('D15').value = data.conditionPaiement || '60 JRs de la réception de facture';
  sheet.getCell('D15').font = valFont;
  sheet.getCell('D15').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  sheet.getCell('D15').border = thinBorder;
  sheet.getCell('D15').fill = softFill;

  // Mode de livraison (E13 & E15)
  sheet.getCell('E13').value = 'Mode de livraison';
  sheet.getCell('E13').font = headerFont;
  sheet.getCell('E13').alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getCell('E13').border = thinBorder;
  sheet.getCell('E13').fill = headerFill;

  sheet.getCell('E15').value = data.modeLivraison || 'Par nos soins';
  sheet.getCell('E15').font = valFont;
  sheet.getCell('E15').alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getCell('E15').border = thinBorder;
  sheet.getCell('E15').fill = softFill;

  sheet.getRow(13).height = 20;
  sheet.getRow(15).height = 24;

  // 5. TABLE HEADER (Row 18)
  const thRow = 18;
  sheet.getRow(thRow).height = 26;

  const thFont = { name: 'Arial', size: 10.5, bold: true, color: { argb: 'FF1F2937' } };
  const thBorder = {
    top: { style: 'medium' as const, color: { argb: 'FF4B5563' } },
    left: { style: 'thin' as const, color: { argb: 'FF4B5563' } },
    bottom: { style: 'medium' as const, color: { argb: 'FF4B5563' } },
    right: { style: 'thin' as const, color: { argb: 'FF4B5563' } },
  };
  const thFill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFE5E7EB' } };

  const headers = [
    { col: 'B', text: 'CODE' },
    { col: 'C', text: 'Désignations' },
    { col: 'D', text: 'Qté' },
    { col: 'E', text: 'Prix Unitaire' },
  ];

  headers.forEach((h) => {
    const cell = sheet.getCell(`${h.col}${thRow}`);
    cell.value = h.text;
    cell.font = thFont;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thBorder;
    cell.fill = thFill;
  });

  // 6. TABLE BODY (Rows 19 to 32)
  const lignes = data.lignes || [];
  const startRow = 19;
  const maxRows = Math.max(lignes.length, 12);

  for (let i = 0; i < maxRows; i++) {
    const r = startRow + i;
    const item = lignes[i];
    sheet.getRow(r).height = item?.designation && item.designation.length > 50 ? 34 : 24;

    const cellB = sheet.getCell(`B${r}`);
    const cellC = sheet.getCell(`C${r}`);
    const cellD = sheet.getCell(`D${r}`);
    const cellE = sheet.getCell(`E${r}`);

    cellB.value = item?.code || '';
    cellC.value = item?.designation || '';
    cellD.value = item ? Number(item.quantite) : null;
    cellE.value = item ? Number(item.prixUnitaire) : null;

    cellB.font = { name: 'Calibri', size: 10 };
    cellC.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E3A8A' } };
    cellD.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FF1E3A8A' } };
    cellE.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FF1E3A8A' } };

    cellB.alignment = { horizontal: 'center', vertical: 'middle' };
    cellC.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    cellD.alignment = { horizontal: 'right', vertical: 'middle' };
    cellE.alignment = { horizontal: 'right', vertical: 'middle' };

    cellD.numFmt = '#,##0.00';
    cellE.numFmt = '#,##0.00';

    const rowBorder = {
      left: { style: 'thin' as const, color: { argb: 'FF9CA3AF' } },
      right: { style: 'thin' as const, color: { argb: 'FF9CA3AF' } },
      bottom: { style: 'dotted' as const, color: { argb: 'FFE5E7EB' } },
    };
    cellB.border = rowBorder;
    cellC.border = rowBorder;
    cellD.border = rowBorder;
    cellE.border = rowBorder;
  }

  // 7. CHANTIER FOOTER (Row startRow + maxRows)
  const chantierRow = startRow + maxRows;
  sheet.getRow(chantierRow).height = 26;
  sheet.mergeCells(`B${chantierRow}:E${chantierRow}`);
  const chantierCell = sheet.getCell(`B${chantierRow}`);
  const chantierText = data.chantier || data.clientNom;
  chantierCell.value = `Chantier ${chantierText}`;
  chantierCell.font = { name: 'Calibri', size: 10.5, italic: true, bold: true, color: { argb: 'FF1F2937' } };
  chantierCell.alignment = { horizontal: 'left', vertical: 'middle' };

  const footerBorder = {
    top: { style: 'thin' as const, color: { argb: 'FF1F2937' } },
    left: { style: 'medium' as const, color: { argb: 'FF1F2937' } },
    bottom: { style: 'medium' as const, color: { argb: 'FF1F2937' } },
    right: { style: 'medium' as const, color: { argb: 'FF1F2937' } },
  };
  for (const col of ['B', 'C', 'D', 'E']) {
    sheet.getCell(`${col}${chantierRow}`).border = footerBorder;
  }

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
