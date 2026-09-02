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
  afficherChantier?: boolean;
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

  // Détection infaillible de CHIMIRAL (par champ societe, codeClient CH..., ou numéro)
  const isChimiral =
    (data.societe || '').toUpperCase().includes('CHIMIRAL') ||
    (data.codeClient || '').toUpperCase().startsWith('CH') ||
    (data.numeroBl || '').toUpperCase().includes('CHIMIRAL');

  // Configuration d'impression A4 avec marge adaptée selon la société
  sheet.pageSetup = {
    paperSize: 9, // Format A4
    orientation: 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 1,
    horizontalCentered: false,
    verticalCentered: true,
    margins: {
      left: 0.35,
      right: 0.25,
      top: 0.3,
      bottom: 0.3,
      header: 0.1,
      footer: 0.1,
    },
  };

  sheet.views = [{ showGridLines: true }];

  // Colonne A : 63 Pixels (7.71) pour CHIMIRAL, 13 Pixels (1.14) pour OXYRAL
  sheet.getColumn('A').width = isChimiral ? 7.71 : 1.14;
  sheet.getColumn('B').width = isChimiral ? 14 : 15;
  sheet.getColumn('C').width = isChimiral ? 46 : 48;
  sheet.getColumn('D').width = isChimiral ? 24 : 25;
  sheet.getColumn('E').width = isChimiral ? 24 : 25;

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

  // 1. TOP RIGHT CADRE: "BON DE LIVRAISON"
  sheet.mergeCells('D2:E3');
  const blTitleCell = sheet.getCell('D2');
  blTitleCell.value = 'BON DE LIVRAISON';
  blTitleCell.font = { name: 'Arial', size: 18, bold: true, color: { argb: 'FF1F2937' } };
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
  dateCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF374151' } };
  dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
  dateCell.border = thinBorder;
  dateCell.fill = softFill;

  // Sub-box N° (E4)
  const numCell = sheet.getCell('E4');
  numCell.value = `N : ${data.numeroBl || ''}`;
  numCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF374151' } };
  numCell.alignment = { horizontal: 'center', vertical: 'middle' };
  numCell.border = thinBorder;
  numCell.fill = softFill;

  // 2. CADRE ENTREPRISE (B6:C11) - CHIMIRAL SARL / OXYRAL SARL en Gras Taille 12
  sheet.mergeCells('B6:C11');
  const compCell = sheet.getCell('B6');
  compCell.value = {
    richText: [
      {
        font: { name: 'Arial', size: 12, bold: true, color: { argb: 'FF1F2937' } },
        text: isChimiral ? 'CHIMIRAL SARL\n' : 'OXYRAL SARL\n',
      },
      {
        font: { name: 'Calibri', size: 10, color: { argb: 'FF374151' } },
        text: isChimiral
          ? `12 Rue Des Hopitaux\nCasablanca\nTéléphone : 05 22 33 29 05\nMail: chimiral@oxyral.ma`
          : `Zone Industriel TIT MELLIL\nCasablanca\nTéléphone : 0522 332 905\nFax       : 0522 329 062\nMail: oxyral2010@gmail.com`,
      },
    ],
  };
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
  clientCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF111827' } };
  clientCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  clientCell.fill = softFill;

  for (let r = 6; r <= 11; r++) {
    sheet.getCell(`D${r}`).border = boxBorder;
    sheet.getCell(`E${r}`).border = boxBorder;
  }

  // 4. CADRES DES 4 MÉTRIQUES (Rows 13 & 15)
  const headerFont = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF374151' } };
  const valFont = { name: 'Calibri', size: 10.5, color: { argb: 'FF111827' } };

  // Code client
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

  // N° BON COMMANDE
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

  // Conditions de payement
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

  // Mode de livraison
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

  sheet.getRow(13).height = 22;
  sheet.getRow(15).height = 26;

  // 5. TABLE HEADER (Row 18)
  const thRow = 18;
  sheet.getRow(thRow).height = 32;

  const thFont = { name: 'Arial', size: 11.5, bold: true, color: { argb: 'FF1F2937' } };
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

  // 6. TABLE BODY (Grandes cases aérées de 58px à 78px de hauteur par ligne)
  const lignes = data.lignes || [];
  const startRow = 19;
  const itemRowsCount = Math.max(lignes.length, 8);

  for (let i = 0; i < itemRowsCount; i++) {
    const r = startRow + i;
    const item = lignes[i];
    
    // Hauteur de ligne spacieuse (58px base, 68px/78px si désignation longue)
    const textLen = item?.designation ? item.designation.length : 0;
    sheet.getRow(r).height = textLen > 60 ? 78 : (textLen > 30 ? 68 : 58);

    const cellB = sheet.getCell(`B${r}`);
    const cellC = sheet.getCell(`C${r}`);
    const cellD = sheet.getCell(`D${r}`);
    const cellE = sheet.getCell(`E${r}`);

    cellB.value = item?.code || '';
    cellC.value = item?.designation || '';
    cellD.value = item ? Number(item.quantite) : null;
    cellE.value = item ? Number(item.prixUnitaire) : null;

    cellB.font = { name: 'Calibri', size: 11 };
    
    // Texte Désignation 12pt Gras Arial
    cellC.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF1E3A8A' } };
    cellD.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF1E3A8A' } };
    cellE.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF1E3A8A' } };

    cellB.alignment = { horizontal: 'center', vertical: 'middle' };
    cellC.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    cellD.alignment = { horizontal: 'right', vertical: 'middle' };
    cellE.alignment = { horizontal: 'right', vertical: 'middle' };

    cellD.numFmt = '#,##0.00';
    cellE.numFmt = '#,##0.00';

    const rowBorder = {
      top: { style: 'thin' as const, color: { argb: 'FF9CA3AF' } },
      left: { style: 'thin' as const, color: { argb: 'FF9CA3AF' } },
      right: { style: 'thin' as const, color: { argb: 'FF9CA3AF' } },
      bottom: { style: 'thin' as const, color: { argb: 'FF9CA3AF' } },
    };
    cellB.border = rowBorder;
    cellC.border = rowBorder;
    cellD.border = rowBorder;
    cellE.border = rowBorder;
  }

  // 7. CHANTIER FOOTER (Bas de page A4 - uniquement si l'utilisateur a COCHÉ la case)
  const shouldShowChantier =
    data.afficherChantier === true && Boolean(data.chantier && data.chantier.trim());

  if (shouldShowChantier) {
    const chantierRow = startRow + itemRowsCount;
    sheet.getRow(chantierRow).height = 32;
    sheet.mergeCells(`B${chantierRow}:E${chantierRow}`);
    const chantierCell = sheet.getCell(`B${chantierRow}`);
    chantierCell.value = `Chantier ${data.chantier?.trim() || ''}`;
    chantierCell.font = { name: 'Calibri', size: 11, italic: true, bold: true, color: { argb: 'FF1F2937' } };
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
  }

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
