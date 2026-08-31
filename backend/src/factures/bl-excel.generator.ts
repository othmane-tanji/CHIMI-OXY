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
  sheet.views = [{ showGridLines: true }];

  // Column widths matching exact layout
  sheet.getColumn('A').width = 3;
  sheet.getColumn('B').width = 14;
  sheet.getColumn('C').width = 48;
  sheet.getColumn('D').width = 18;
  sheet.getColumn('E').width = 22;

  const grayBorder = {
    top: { style: 'thin' as const, color: { argb: 'FFA0A0A0' } },
    left: { style: 'thin' as const, color: { argb: 'FFA0A0A0' } },
    bottom: { style: 'thin' as const, color: { argb: 'FFA0A0A0' } },
    right: { style: 'thin' as const, color: { argb: 'FFA0A0A0' } },
  };

  const isChimiral = (data.societe || 'OXYRAL') === 'CHIMIRAL';

  // 1. TOP RIGHT BOX: "BON DE LIVRAISON"
  sheet.mergeCells('D2:E3');
  const blTitleCell = sheet.getCell('D2');
  blTitleCell.value = 'BON DE LIVRAISON';
  blTitleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF000000' } };
  blTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  ['D2', 'E2', 'D3', 'E3'].forEach((addr) => {
    sheet.getCell(addr).border = grayBorder;
  });

  // Sub-box Date (D4)
  const dateFormatted = data.dateFacture
    ? new Date(data.dateFacture).toLocaleDateString('fr-FR')
    : new Date().toLocaleDateString('fr-FR');
  const dateCell = sheet.getCell('D4');
  dateCell.value = `Date: ${dateFormatted}`;
  dateCell.font = { name: 'Calibri', size: 10 };
  dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
  dateCell.border = grayBorder;

  // Sub-box N° (E4)
  const numCell = sheet.getCell('E4');
  numCell.value = `N : ${data.numeroBl || ''}`;
  numCell.font = { name: 'Calibri', size: 10 };
  numCell.alignment = { horizontal: 'center', vertical: 'middle' };
  numCell.border = grayBorder;

  // 2. COMPANY BOX (B6:C11)
  sheet.mergeCells('B6:C11');
  const compCell = sheet.getCell('B6');
  compCell.value = isChimiral
    ? `CHIMIRAL SARL\n12 Rue Des Hopitaux\nCasablanca\nTéléphone : 05 22 33 29 05\nMail: chimiral@oxyral.ma`
    : `OXYRAL SARL\nZone Industriel TIT MELLIL\nCasablanca\nTéléphone : 0522 332 905\nFax       : 0522 329 062\nMail: oxyral2010@gmail.com`;
  compCell.font = { name: 'Calibri', size: 10 };
  compCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };

  for (let r = 6; r <= 11; r++) {
    sheet.getCell(`B${r}`).border = grayBorder;
    sheet.getCell(`C${r}`).border = grayBorder;
  }

  // 3. CLIENT BOX (D6:E11)
  sheet.mergeCells('D6:E11');
  const clientCell = sheet.getCell('D6');
  const clientNom = (data.clientNom || '').toUpperCase();
  const clientIce = data.clientIce ? `ICE: ${data.clientIce}` : '';
  clientCell.value = `${clientNom}\n${clientIce}`;
  clientCell.font = { name: 'Calibri', size: 14, bold: true };
  clientCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  for (let r = 6; r <= 11; r++) {
    sheet.getCell(`D${r}`).border = grayBorder;
    sheet.getCell(`E${r}`).border = grayBorder;
  }

  // 4. METRIC BOXES (Rows 13-15)
  const headerFont = { name: 'Calibri', size: 9, bold: true };
  const valFont = { name: 'Calibri', size: 9.5 };

  // Code client
  sheet.getCell('B13').value = 'Code client';
  sheet.getCell('B13').font = headerFont;
  sheet.getCell('B13').alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getCell('B13').border = grayBorder;

  sheet.getCell('B15').value = data.codeClient || (isChimiral ? 'CH704' : '601');
  sheet.getCell('B15').font = valFont;
  sheet.getCell('B15').alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getCell('B15').border = grayBorder;

  // N° BON COMMANDE
  sheet.getCell('C13').value = 'N° BON COMMANDE';
  sheet.getCell('C13').font = headerFont;
  sheet.getCell('C13').alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getCell('C13').border = grayBorder;

  sheet.getCell('C15').value = data.bonCommande || '';
  sheet.getCell('C15').font = valFont;
  sheet.getCell('C15').alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getCell('C15').border = grayBorder;

  // Conditions de payement
  sheet.getCell('D13').value = 'Conditions de payement';
  sheet.getCell('D13').font = headerFont;
  sheet.getCell('D13').alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getCell('D13').border = grayBorder;

  sheet.getCell('D15').value = data.conditionPaiement || '60 JRs de la réception de facture';
  sheet.getCell('D15').font = valFont;
  sheet.getCell('D15').alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getCell('D15').border = grayBorder;

  // Mode de livraison
  sheet.getCell('E13').value = 'Mode de livraison';
  sheet.getCell('E13').font = headerFont;
  sheet.getCell('E13').alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getCell('E13').border = grayBorder;

  sheet.getCell('E15').value = data.modeLivraison || 'Par nos soins';
  sheet.getCell('E15').font = valFont;
  sheet.getCell('E15').alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getCell('E15').border = grayBorder;

  // 5. TABLE HEADER (Row 18)
  const thRow = 18;
  const thFont = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF374151' } };
  const thBorder = {
    top: { style: 'thin' as const, color: { argb: 'FF000000' } },
    left: { style: 'thin' as const, color: { argb: 'FF000000' } },
    bottom: { style: 'thin' as const, color: { argb: 'FF000000' } },
    right: { style: 'thin' as const, color: { argb: 'FF000000' } },
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
    cellD.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E3A8A' } };
    cellE.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E3A8A' } };

    cellB.alignment = { horizontal: 'center', vertical: 'middle' };
    cellC.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    cellD.alignment = { horizontal: 'right', vertical: 'middle' };
    cellE.alignment = { horizontal: 'right', vertical: 'middle' };

    cellD.numFmt = '#,##0.00';
    cellE.numFmt = '#,##0.00';

    const rowBorder = {
      left: { style: 'thin' as const, color: { argb: 'FF000000' } },
      right: { style: 'thin' as const, color: { argb: 'FF000000' } },
    };
    cellB.border = rowBorder;
    cellC.border = rowBorder;
    cellD.border = rowBorder;
    cellE.border = rowBorder;
  }

  // 7. CHANTIER FOOTER (Row startRow + maxRows)
  const chantierRow = startRow + maxRows;
  sheet.mergeCells(`B${chantierRow}:E${chantierRow}`);
  const chantierCell = sheet.getCell(`B${chantierRow}`);
  const chantierText = data.chantier || data.clientNom;
  chantierCell.value = `Chantier ${chantierText}`;
  chantierCell.font = { name: 'Calibri', size: 10, italic: true, bold: true, color: { argb: 'FF374151' } };
  chantierCell.alignment = { horizontal: 'left', vertical: 'middle' };

  const footerBorder = {
    top: { style: 'thin' as const, color: { argb: 'FF000000' } },
    left: { style: 'thick' as const, color: { argb: 'FF000000' } },
    bottom: { style: 'thick' as const, color: { argb: 'FF000000' } },
    right: { style: 'thick' as const, color: { argb: 'FF000000' } },
  };
  for (const col of ['B', 'C', 'D', 'E']) {
    sheet.getCell(`${col}${chantierRow}`).border = footerBorder;
  }

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
