import * as ExcelJS from 'exceljs';

const MOIS_NOMS = [
  'JANVIER', 'FÉVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN',
  'JUILLET', 'AOÛT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DÉCEMBRE',
];

export interface EmployeCongeExcelData {
  employe: {
    id: number;
    nom: string;
    prenom: string;
    societe: string;
    dateEmbauche: Date;
    cin?: string;
  };
  soldeInitial: number;
  joursConsommes: number;
  soldeRestant: number;
  conges: {
    id: number;
    date: Date;
    typeJour?: string;
    motif?: string | null;
  }[];
}

export async function generateCongeExcel(data: {
  employe: {
    id: number;
    nom: string;
    prenom: string;
    societe: string;
    dateEmbauche: Date;
    cin?: string;
  };
  soldeInitial: number;
  joursConsommes: number;
  soldeRestant: number;
  annee: number;
  mois?: number;
  isAllYears?: boolean;
  conges: {
    id: number;
    date: Date;
    typeJour?: string;
    motif?: string | null;
  }[];
}): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Beta ERP - Oxyral & Chimiral';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Relevé de congés', {
    views: [{ showGridLines: true }],
  });

  buildSingleEmployeeSheet(sheet, data);

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
}

export async function generateCongesGlobalExcel(data: {
  annee: number;
  employes: EmployeCongeExcelData[];
}): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Beta ERP - Oxyral & Chimiral';
  workbook.created = new Date();

  // 1. Feuille de Synthèse Globale
  const summarySheet = workbook.addWorksheet('RÉSUMÉ GLOBAL', {
    views: [{ showGridLines: true }],
  });

  summarySheet.columns = [
    { key: 'A', width: 8 },
    { key: 'B', width: 18 },
    { key: 'C', width: 28 },
    { key: 'D', width: 18 },
    { key: 'E', width: 16 },
    { key: 'F', width: 18 },
    { key: 'G', width: 18 },
  ];

  // En-tête Titre ERP
  summarySheet.mergeCells('A1:G2');
  const titleCell = summarySheet.getCell('A1');
  titleCell.value = `SYNTHÈSE ANNUELLE DES CONGÉS ET ABSENCES — TOUS LES EMPLOYÉS (${data.annee})`;
  titleCell.font = { name: 'Calibri', size: 15, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

  summarySheet.mergeCells('A3:G3');
  const subTitle = summarySheet.getCell('A3');
  subTitle.value = `Document officiel consolidé exporté le ${new Date().toLocaleDateString('fr-FR')}  |  Oxyral & Chimiral`;
  subTitle.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF4B5563' } };
  subTitle.alignment = { vertical: 'middle', horizontal: 'center' };

  // En-têtes du tableau de synthèse
  const headers = ['N°', 'Société', 'Employé (Nom & Prénom)', "Date d'embauche", 'Droit (Jours)', 'Pris (Jours)', 'Solde disponible'];
  const headerRow = summarySheet.getRow(5);

  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
    cell.alignment = { horizontal: i === 0 || i >= 4 ? 'center' : 'left', vertical: 'middle' };
  });

  let rowIdx = 6;
  let totalDroit = 0;
  let totalPris = 0;
  let totalSolde = 0;

  data.employes.forEach((emp, idx) => {
    const row = summarySheet.getRow(rowIdx);
    const nomComplet = `${emp.employe.prenom} ${emp.employe.nom}`;
    totalDroit += emp.soldeInitial;
    totalPris += emp.joursConsommes;
    totalSolde += emp.soldeRestant;

    row.getCell(1).value = idx + 1;
    row.getCell(2).value = emp.employe.societe;
    row.getCell(3).value = nomComplet;
    row.getCell(4).value = new Date(emp.employe.dateEmbauche).toLocaleDateString('fr-FR');
    row.getCell(5).value = `${emp.soldeInitial}j`;
    row.getCell(6).value = `${emp.joursConsommes}j`;
    row.getCell(7).value = `${emp.soldeRestant}j`;

    row.getCell(1).alignment = { horizontal: 'center' };
    row.getCell(2).alignment = { horizontal: 'left' };
    row.getCell(3).alignment = { horizontal: 'left' };
    row.getCell(4).alignment = { horizontal: 'center' };
    row.getCell(5).alignment = { horizontal: 'center' };
    row.getCell(6).alignment = { horizontal: 'center' };
    row.getCell(7).alignment = { horizontal: 'center' };

    row.getCell(7).font = {
      bold: true,
      color: { argb: emp.soldeRestant >= 0 ? 'FF16A34A' : 'FCDC2626' },
    };

    if (idx % 2 === 1) {
      for (let col = 1; col <= 7; col++) {
        row.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
      }
    }

    rowIdx++;
  });

  // Total Synthèse
  const footerRow = summarySheet.getRow(rowIdx);
  summarySheet.mergeCells(`A${rowIdx}:D${rowIdx}`);
  footerRow.getCell(1).value = 'TOTALS CUMULÉS :';
  footerRow.getCell(1).font = { bold: true, size: 11 };
  footerRow.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };

  footerRow.getCell(5).value = `${totalDroit}j`;
  footerRow.getCell(6).value = `${totalPris}j`;
  footerRow.getCell(7).value = `${totalSolde}j`;

  [5, 6, 7].forEach((col) => {
    footerRow.getCell(col).font = { bold: true, size: 11 };
    footerRow.getCell(col).alignment = { horizontal: 'center' };
  });

  for (let col = 1; col <= 7; col++) {
    footerRow.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
  }

  // Bordures synthèse
  for (let r = 5; r <= rowIdx; r++) {
    for (let c = 1; c <= 7; c++) {
      summarySheet.getCell(r, c).border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    }
  }

  // 2. Feuilles Individuelles (1 feuille par employé)
  const usedSheetNames = new Set<string>();

  data.employes.forEach((empData) => {
    // Nom d'onglet propre (max 31 caractères, unique)
    let sheetName = `${empData.employe.prenom} ${empData.employe.nom}`
      .replace(/[\\/*?:[\]]/g, '')
      .substring(0, 30);
    
    if (usedSheetNames.has(sheetName)) {
      sheetName = `${sheetName}_${empData.employe.id}`.substring(0, 30);
    }
    usedSheetNames.add(sheetName);

    const empSheet = workbook.addWorksheet(sheetName, {
      views: [{ showGridLines: true }],
    });

    empSheet.columns = [
      { key: 'A', width: 8 },
      { key: 'B', width: 22 },
      { key: 'C', width: 25 },
      { key: 'D', width: 18 },
      { key: 'E', width: 35 },
    ];

    buildSingleEmployeeSheet(empSheet, {
      ...empData,
      annee: data.annee,
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
}

function buildSingleEmployeeSheet(
  sheet: ExcelJS.Worksheet,
  data: {
    employe: {
      id: number;
      nom: string;
      prenom: string;
      societe: string;
      dateEmbauche: Date;
      cin?: string;
    };
    soldeInitial: number;
    joursConsommes: number;
    soldeRestant: number;
    annee: number;
    mois?: number;
    isAllYears?: boolean;
    conges: {
      id: number;
      date: Date;
      typeJour?: string;
      motif?: string | null;
    }[];
  },
) {
  const isAllYears = data.isAllYears || data.annee <= 0;
  const isChimiral = data.employe.societe === 'CHIMIRAL';
  const mainColorHex = isChimiral ? 'FF059669' : 'FF1E40AF';
  const moisLabel = data.mois && data.mois >= 1 && data.mois <= 12 ? MOIS_NOMS[data.mois - 1] : '';

  // 1. En-tête Titre ERP
  sheet.mergeCells('A1:E2');
  const titleCell = sheet.getCell('A1');

  if (isAllYears) {
    titleCell.value = `RELEVÉ HISTORIQUE DES ABSENCES (TOUTES LES ANNÉES) — ${data.employe.societe.toUpperCase()}`;
  } else if (data.mois) {
    titleCell.value = `RELEVÉ DES ABSENCES — ${moisLabel} ${data.annee} — ${data.employe.societe.toUpperCase()}`;
  } else {
    titleCell.value = `RELEVÉ ANNUEL DES CONGÉS ET ABSENCES ${data.annee} — ${data.employe.societe.toUpperCase()}`;
  }

  titleCell.font = { name: 'Calibri', size: 15, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: mainColorHex } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

  // Sous-titre
  sheet.mergeCells('A3:E3');
  const subTitle = sheet.getCell('A3');

  if (isAllYears) {
    subTitle.value = `Historique complet (Toutes les années)  |  Document officiel exporté le ${new Date().toLocaleDateString('fr-FR')}`;
  } else if (data.mois) {
    subTitle.value = `Période : ${moisLabel} ${data.annee}  |  Document officiel exporté le ${new Date().toLocaleDateString('fr-FR')}`;
  } else {
    subTitle.value = `Année : ${data.annee}  |  Document officiel exporté le ${new Date().toLocaleDateString('fr-FR')}`;
  }

  subTitle.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF4B5563' } };
  subTitle.alignment = { vertical: 'middle', horizontal: 'center' };

  // 2. Informations Employé
  sheet.getCell('A5').value = 'Employé :';
  sheet.getCell('A5').font = { bold: true, size: 11, color: { argb: 'FF334155' } };
  sheet.mergeCells('B5:C5');
  sheet.getCell('B5').value = `${data.employe.prenom} ${data.employe.nom}`;
  sheet.getCell('B5').font = { bold: true, size: 11, color: { argb: 'FF0F172A' } };

  sheet.getCell('D5').value = 'Société :';
  sheet.getCell('D5').font = { bold: true, size: 11, color: { argb: 'FF334155' } };
  sheet.getCell('E5').value = data.employe.societe;
  sheet.getCell('E5').font = { bold: true, size: 11, color: { argb: mainColorHex } };

  sheet.getCell('A6').value = 'CIN :';
  sheet.getCell('A6').font = { bold: true, size: 11, color: { argb: 'FF334155' } };
  sheet.mergeCells('B6:C6');
  sheet.getCell('B6').value = data.employe.cin || '-';

  sheet.getCell('D6').value = "Date d'embauche :";
  sheet.getCell('D6').font = { bold: true, size: 11, color: { argb: 'FF334155' } };
  sheet.getCell('E6').value = new Date(data.employe.dateEmbauche).toLocaleDateString('fr-FR');

  // 3. Cartes KPI de Solde
  sheet.mergeCells('A8:B8');
  sheet.getCell('A8').value = 'DROIT ANNUEL TOTAL';
  sheet.getCell('A8').font = { bold: true, size: 9, color: { argb: 'FF475569' } };
  sheet.getCell('A8').alignment = { horizontal: 'center', vertical: 'middle' };

  sheet.getCell('C8').value = isAllYears
    ? 'TOTAL ABSENCES (TOUTES ANNÉES)'
    : data.mois
    ? `ABSENCES (${moisLabel})`
    : 'ABSENCES CUMULÉES';
  sheet.getCell('C8').font = { bold: true, size: 9, color: { argb: 'FF475569' } };
  sheet.getCell('C8').alignment = { horizontal: 'center', vertical: 'middle' };

  sheet.mergeCells('D8:E8');
  sheet.getCell('D8').value = 'SOLDE ANNUEL DISPONIBLE';
  sheet.getCell('D8').font = { bold: true, size: 9, color: { argb: 'FF475569' } };
  sheet.getCell('D8').alignment = { horizontal: 'center', vertical: 'middle' };

  // Valeurs KPI
  sheet.mergeCells('A9:B9');
  sheet.getCell('A9').value = `${data.soldeInitial} jours`;
  sheet.getCell('A9').font = { bold: true, size: 14, color: { argb: 'FF2563EB' } };
  sheet.getCell('A9').alignment = { horizontal: 'center', vertical: 'middle' };

  const totalMoisConges = data.conges.reduce((sum, c) => {
    return sum + (c.typeJour === 'MATIN' || c.typeJour === 'APRES_MIDI' ? 0.5 : 1.0);
  }, 0);

  sheet.getCell('C9').value = `${totalMoisConges} jours`;
  sheet.getCell('C9').font = { bold: true, size: 14, color: { argb: 'FFD97706' } };
  sheet.getCell('C9').alignment = { horizontal: 'center', vertical: 'middle' };

  sheet.mergeCells('D9:E9');
  sheet.getCell('D9').value = `${data.soldeRestant} jours`;
  sheet.getCell('D9').font = {
    bold: true,
    size: 14,
    color: { argb: data.soldeRestant >= 0 ? 'FF16A34A' : 'FCDC2626' },
  };
  sheet.getCell('D9').alignment = { horizontal: 'center', vertical: 'middle' };

  // Couleurs de fond pour cartes KPI
  ['A8', 'B8', 'C8', 'D8', 'E8', 'A9', 'B9', 'C9', 'D9', 'E9'].forEach((c) => {
    sheet.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
  });

  // 4. En-têtes du tableau des absences
  const headers = ['N°', "Date d'absence", 'Durée / Moment', 'Valeur (Jours)', 'Motif / Remarque'];
  const headerRow = sheet.getRow(12);

  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
    cell.alignment = { horizontal: i === 0 || i === 3 ? 'center' : 'left', vertical: 'middle' };
  });

  // 5. Lignes de données
  let startRow = 13;
  let totalConsommesInTable = 0;

  if (data.conges.length === 0) {
    sheet.mergeCells(`A${startRow}:E${startRow}`);
    const emptyCell = sheet.getCell(`A${startRow}`);
    emptyCell.value = isAllYears
      ? 'Aucune absence enregistrée dans l\'historique.'
      : data.mois
      ? `Aucune absence enregistrée pour la période ${moisLabel} ${data.annee}.`
      : 'Aucune absence enregistrée pour cet employé.';
    emptyCell.font = { italic: true, color: { argb: 'FF64748B' } };
    emptyCell.alignment = { horizontal: 'center', vertical: 'middle' };
    startRow++;
  } else {
    data.conges.forEach((c, idx) => {
      const row = sheet.getRow(startRow);
      const val = c.typeJour === 'MATIN' || c.typeJour === 'APRES_MIDI' ? 0.5 : 1.0;
      totalConsommesInTable += val;

      const durationLabel =
        c.typeJour === 'MATIN'
          ? 'Matinée (0.5j)'
          : c.typeJour === 'APRES_MIDI'
          ? 'Après-midi (0.5j)'
          : 'Journée entière (1.0j)';

      row.getCell(1).value = idx + 1;
      row.getCell(2).value = new Date(c.date).toLocaleDateString('fr-FR');
      row.getCell(3).value = durationLabel;
      row.getCell(4).value = val;
      row.getCell(5).value = c.motif || '-';

      row.getCell(1).alignment = { horizontal: 'center' };
      row.getCell(2).alignment = { horizontal: 'left' };
      row.getCell(3).alignment = { horizontal: 'left' };
      row.getCell(4).alignment = { horizontal: 'center' };
      row.getCell(5).alignment = { horizontal: 'left' };

      if (idx % 2 === 1) {
        for (let col = 1; col <= 5; col++) {
          row.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
        }
      }

      startRow++;
    });
  }

  // Pied de tableau
  const footerRow = sheet.getRow(startRow);
  sheet.mergeCells(`A${startRow}:C${startRow}`);
  footerRow.getCell(1).value = isAllYears
    ? 'TOTAL DES ABSENCES (TOUTES ANNÉES) :'
    : data.mois
    ? `TOTAL DES ABSENCES (${moisLabel}) :`
    : 'TOTAL DES ABSENCES CUMULÉES :';
  footerRow.getCell(1).font = { bold: true, size: 11 };
  footerRow.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };

  footerRow.getCell(4).value = `${totalConsommesInTable} jour(s)`;
  footerRow.getCell(4).font = { bold: true, size: 11, color: { argb: 'FFD97706' } };
  footerRow.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };

  for (let col = 1; col <= 5; col++) {
    footerRow.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
  }

  for (let r = 12; r <= startRow; r++) {
    for (let c = 1; c <= 5; c++) {
      sheet.getCell(r, c).border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    }
  }
}
