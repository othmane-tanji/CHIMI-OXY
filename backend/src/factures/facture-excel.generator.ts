import * as ExcelJS from 'exceljs';

export interface FactureExcelData {
  numeroFacture: string;
  dateFacture: Date | string;
  societe?: string;
  clientNom: string;
  clientIce?: string;
  codeClient?: string;
  bonCommande?: string;
  numeroBl?: string;
  conditionPaiement?: string;
  delaiPaiement?: string;
  typeEntetePaiement?: string;
  valeurEntetePaiement?: string;
  rib?: string;
  chantier?: string;
  afficherChantier?: boolean;
  totalHt?: number;
  totalTva?: number;
  totalTtc?: number;
  montantEnLettres?: string;
  lignes: {
    code?: string;
    designation: string;
    quantite: number;
    prixUnitaire: number;
    montantHt?: number;
  }[];
}

export async function generateFactureExcelBuffer(data: FactureExcelData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Beta ERP';

  const sheet = wb.addWorksheet('Facture');

  const isChimiral = (data.societe || 'OXYRAL').toUpperCase() === 'CHIMIRAL';
  const clientUpper = (data.clientNom || '').toUpperCase();
  const isMarjaneOrPrimarios =
    clientUpper.includes('MARJANE') || clientUpper.includes('PRIMARIOS');

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

  // Colonne A: 63px (7.71) pour CHIMIRAL, 13px (1.14) pour OXYRAL
  sheet.getColumn('A').width = isChimiral ? 7.71 : 1.14;
  sheet.getColumn('B').width = 14; // CODE
  sheet.getColumn('C').width = 44; // Désignations
  sheet.getColumn('D').width = 18; // Qté
  sheet.getColumn('E').width = 20; // Prix Unitaire
  sheet.getColumn('F').width = 22; // Montant HT

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

  // 1. TOP RIGHT CADRE: "FACTURE"
  sheet.mergeCells('E2:F3');
  const titleCell = sheet.getCell('E2');
  titleCell.value = 'FACTURE';
  titleCell.font = { name: 'Arial', size: 18, bold: true, color: { argb: 'FF1F2937' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = headerFill;

  ['E2', 'F2', 'E3', 'F3'].forEach((addr) => {
    sheet.getCell(addr).border = boxBorder;
  });

  // Sub-box Date (E4)
  const dateFormatted = data.dateFacture
    ? new Date(data.dateFacture).toLocaleDateString('fr-FR')
    : new Date().toLocaleDateString('fr-FR');
  const dateCell = sheet.getCell('E4');
  dateCell.value = `Date: ${dateFormatted}`;
  dateCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF374151' } };
  dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
  dateCell.border = thinBorder;
  dateCell.fill = softFill;

  // Sub-box N° (F4)
  const numCell = sheet.getCell('F4');
  numCell.value = `N : ${data.numeroFacture || ''}`;
  numCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF374151' } };
  numCell.alignment = { horizontal: 'center', vertical: 'middle' };
  numCell.border = thinBorder;
  numCell.fill = softFill;

  // 2. CADRE ENTREPRISE (B6:C11) - OXYRAL / CHIMIRAL (Gras 12pt)
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

  // 3. CADRE CLIENT (D6:F11)
  sheet.mergeCells('D6:F11');
  const clientCell = sheet.getCell('D6');
  const clientNom = (data.clientNom || '').toUpperCase();
  const clientIce = data.clientIce ? `ICE: ${data.clientIce}` : '';
  clientCell.value = `${clientNom}\n${clientIce}`;
  clientCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF111827' } };
  clientCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  clientCell.fill = softFill;

  for (let r = 6; r <= 11; r++) {
    for (const c of ['D', 'E', 'F']) {
      sheet.getCell(`${c}${r}`).border = boxBorder;
    }
  }

  // 4. METRIQUES EN-TÊTE (Row 13 & Row 15)
  const headerFont = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF374151' } };
  const valFont = { name: 'Calibri', size: 10.5, color: { argb: 'FF111827' } };

  // Metric 1: Code client (B)
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

  // Metric 2: N° BON COMMANDE (C)
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

  // Metric 3: N° BON DE LIVRAISON (D)
  sheet.getCell('D13').value = 'N° BON DE LIVRAISON';
  sheet.getCell('D13').font = headerFont;
  sheet.getCell('D13').alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getCell('D13').border = thinBorder;
  sheet.getCell('D13').fill = headerFill;

  sheet.getCell('D15').value = data.numeroBl || data.numeroFacture || '';
  sheet.getCell('D15').font = valFont;
  sheet.getCell('D15').alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getCell('D15').border = thinBorder;
  sheet.getCell('D15').fill = softFill;

  if (isMarjaneOrPrimarios) {
    // Si MARJANE ou PRIMARIOS : E & F fusionnés pour "Conditions de payement"
    sheet.mergeCells('E13:F13');
    const m4Title = sheet.getCell('E13');
    m4Title.value = 'Conditions de payement';
    m4Title.font = headerFont;
    m4Title.alignment = { horizontal: 'center', vertical: 'middle' };
    m4Title.fill = headerFill;
    sheet.getCell('E13').border = thinBorder;
    sheet.getCell('F13').border = thinBorder;

    sheet.mergeCells('E15:F15');
    const m4Val = sheet.getCell('E15');
    m4Val.value = data.conditionPaiement || '60 JRs de la réception de facture';
    m4Val.font = valFont;
    m4Val.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    m4Val.fill = softFill;
    sheet.getCell('E15').border = thinBorder;
    sheet.getCell('F15').border = thinBorder;
  } else {
    // Si AUTRE CLIENT : 5 colonnes séparées (E13/E15 = Délai de paiement, F13/F15 = RIB ou Conditions de paiement)
    sheet.getCell('E13').value = 'Délai de paiement';
    sheet.getCell('E13').font = headerFont;
    sheet.getCell('E13').alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getCell('E13').border = thinBorder;
    sheet.getCell('E13').fill = headerFill;

    sheet.getCell('E15').value = data.delaiPaiement || data.conditionPaiement || '60 JRs de la réception de facture';
    sheet.getCell('E15').font = valFont;
    sheet.getCell('E15').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    sheet.getCell('E15').border = thinBorder;
    sheet.getCell('E15').fill = softFill;

    const fifthTitle = (data.typeEntetePaiement === 'RIB') ? 'RIB' : 'Conditions de payement';
    const fifthVal = (data.typeEntetePaiement === 'RIB')
      ? (data.valeurEntetePaiement || data.rib || '')
      : (data.valeurEntetePaiement || data.conditionPaiement || '60 JRs de la réception de facture');

    sheet.getCell('F13').value = fifthTitle;
    sheet.getCell('F13').font = headerFont;
    sheet.getCell('F13').alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getCell('F13').border = thinBorder;
    sheet.getCell('F13').fill = headerFill;

    sheet.getCell('F15').value = fifthVal;
    sheet.getCell('F15').font = valFont;
    sheet.getCell('F15').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    sheet.getCell('F15').border = thinBorder;
    sheet.getCell('F15').fill = softFill;
  }

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
    { col: 'E', text: 'P.U HT' },
    { col: 'F', text: 'MONTANT HT' },
  ];

  headers.forEach((h) => {
    const cell = sheet.getCell(`${h.col}${thRow}`);
    cell.value = h.text;
    cell.font = thFont;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thBorder;
    cell.fill = thFill;
  });

  // 6. TABLE BODY (Bordures sans lignes horizontales intérieures)
  const lignes = data.lignes || [];
  const startRow = 19;
  const itemRowsCount = Math.max(lignes.length, 8);

  for (let i = 0; i < itemRowsCount; i++) {
    const r = startRow + i;
    const item = lignes[i];
    
    const textLen = item?.designation ? item.designation.length : 0;
    sheet.getRow(r).height = textLen > 60 ? 78 : (textLen > 30 ? 68 : 58);

    const cellB = sheet.getCell(`B${r}`);
    const cellC = sheet.getCell(`C${r}`);
    const cellD = sheet.getCell(`D${r}`);
    const cellE = sheet.getCell(`E${r}`);
    const cellF = sheet.getCell(`F${r}`);

    const qte = item ? Number(item.quantite) : 0;
    const pu = item ? Number(item.prixUnitaire) : 0;
    const mht = item ? Number(item.montantHt ?? qte * pu) : 0;

    cellB.value = item?.code || '';
    cellC.value = item?.designation || '';
    cellD.value = item ? qte : null;
    cellE.value = item ? pu : null;
    cellF.value = item ? mht : null;

    cellB.font = { name: 'Calibri', size: 11 };
    cellC.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF1E3A8A' } };
    cellD.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF1E3A8A' } };
    cellE.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF1E3A8A' } };
    cellF.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF1E3A8A' } };

    cellB.alignment = { horizontal: 'center', vertical: 'middle' };
    cellC.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    cellD.alignment = { horizontal: 'right', vertical: 'middle' };
    cellE.alignment = { horizontal: 'right', vertical: 'middle' };
    cellF.alignment = { horizontal: 'right', vertical: 'middle' };

    cellD.numFmt = '#,##0.00';
    cellE.numFmt = '#,##0.00';
    cellF.numFmt = '#,##0.00';

    const isLastRow = i === itemRowsCount - 1;
    const rowBorder = {
      left: { style: 'thin' as const, color: { argb: 'FF9CA3AF' } },
      right: { style: 'thin' as const, color: { argb: 'FF9CA3AF' } },
      bottom: isLastRow ? { style: 'medium' as const, color: { argb: 'FF4B5563' } } : undefined,
    };

    [cellB, cellC, cellD, cellE, cellF].forEach((c) => (c.border = rowBorder));
  }

  // 7. TOTALS SECTION
  let totRow = startRow + itemRowsCount;

  const totalHt = data.totalHt ?? lignes.reduce((s, l) => s + Number(l.quantite || 0) * Number(l.prixUnitaire || 0), 0);
  const totalTva = data.totalTva ?? totalHt * 0.2;
  const totalTtc = data.totalTtc ?? totalHt + totalTva;

  // TOTAL HORS TAXE
  sheet.getRow(totRow).height = 24;
  sheet.getCell(`E${totRow}`).value = 'TOTAL HORS TAXE';
  sheet.getCell(`E${totRow}`).font = { name: 'Arial', size: 11, bold: true };
  sheet.getCell(`E${totRow}`).alignment = { horizontal: 'right', vertical: 'middle' };
  sheet.getCell(`F${totRow}`).value = totalHt;
  sheet.getCell(`F${totRow}`).numFmt = '#,##0.00';
  sheet.getCell(`F${totRow}`).font = { name: 'Calibri', size: 11, bold: true };
  sheet.getCell(`F${totRow}`).alignment = { horizontal: 'right', vertical: 'middle' };
  [sheet.getCell(`E${totRow}`), sheet.getCell(`F${totRow}`)].forEach((c) => (c.border = thinBorder));

  totRow++;
  // T.V.A 20%
  sheet.getRow(totRow).height = 24;
  sheet.getCell(`E${totRow}`).value = 'T.V.A 20%';
  sheet.getCell(`E${totRow}`).font = { name: 'Arial', size: 11, bold: true };
  sheet.getCell(`E${totRow}`).alignment = { horizontal: 'right', vertical: 'middle' };
  sheet.getCell(`F${totRow}`).value = totalTva;
  sheet.getCell(`F${totRow}`).numFmt = '#,##0.00';
  sheet.getCell(`F${totRow}`).font = { name: 'Calibri', size: 11, bold: true };
  sheet.getCell(`F${totRow}`).alignment = { horizontal: 'right', vertical: 'middle' };
  [sheet.getCell(`E${totRow}`), sheet.getCell(`F${totRow}`)].forEach((c) => (c.border = thinBorder));

  totRow++;
  // TOTAL T.T.C EN DHS
  sheet.getRow(totRow).height = 28;
  sheet.getCell(`E${totRow}`).value = 'TOTAL T.T.C EN DHS';
  sheet.getCell(`E${totRow}`).font = { name: 'Arial', size: 11.5, bold: true, color: { argb: 'FF1E3A8A' } };
  sheet.getCell(`E${totRow}`).alignment = { horizontal: 'right', vertical: 'middle' };
  sheet.getCell(`F${totRow}`).value = totalTtc;
  sheet.getCell(`F${totRow}`).numFmt = '#,##0.00';
  sheet.getCell(`F${totRow}`).font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF1E3A8A' } };
  sheet.getCell(`F${totRow}`).alignment = { horizontal: 'right', vertical: 'middle' };
  [sheet.getCell(`E${totRow}`), sheet.getCell(`F${totRow}`)].forEach((c) => (c.border = boxBorder));

  // Montant en lettres
  if (data.montantEnLettres) {
    totRow++;
    sheet.getRow(totRow).height = 32;
    sheet.mergeCells(`B${totRow}:F${totRow}`);
    const lettCell = sheet.getCell(`B${totRow}`);
    lettCell.value = `Arrêté la présente facture à la somme de : ${data.montantEnLettres}`;
    lettCell.font = { name: 'Calibri', size: 11, italic: true, bold: true, color: { argb: 'FF1F2937' } };
    lettCell.alignment = { horizontal: 'left', vertical: 'middle' };
    ['B', 'C', 'D', 'E', 'F'].forEach((col) => (sheet.getCell(`${col}${totRow}`).border = boxBorder));
  }

  // 8. CHANTIER FOOTER (Si coché)
  if (data.afficherChantier === true && data.chantier && data.chantier.trim()) {
    totRow++;
    sheet.getRow(totRow).height = 32;
    sheet.mergeCells(`B${totRow}:F${totRow}`);
    const chantierCell = sheet.getCell(`B${totRow}`);
    chantierCell.value = `Chantier ${data.chantier.trim()}`;
    chantierCell.font = { name: 'Calibri', size: 11, italic: true, bold: true, color: { argb: 'FF1F2937' } };
    chantierCell.alignment = { horizontal: 'left', vertical: 'middle' };
    ['B', 'C', 'D', 'E', 'F'].forEach((col) => (sheet.getCell(`${col}${totRow}`).border = boxBorder));
  }

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
