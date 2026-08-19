import * as fs from 'fs';
import * as path from 'path';
const PDFDocument = require('pdfkit');
import {
  formatJours,
  formatMontant,
  formatTaux,
  getPeriodeMois,
  round2,
} from './paie.utils';
import { montantEnLettresDirhams } from './montant-lettres.utils';

const SOCIETE_CNSS_DEFAUT = '8229149';

export interface BulletinCumuls {
  joursIr: number;
  cumulBaseImposable: number;
  cumulRetenues: number;
  cumulDeductions: number;
  cumulRetenuesIr: number;
}

function matricule(id: number): string {
  return String(id).padStart(5, '0');
}

function formatDateDot(date: Date): string {
  if (!date || isNaN(date.getTime())) return '-';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

function arrondisNet(net: number) {
  const netArrondi = Math.round(net);
  return {
    netArrondi,
    gainArrondis: round2(netArrondi - net),
    retArrondis: round2(net - netArrondi),
  };
}

function formatMontantSigned(n: number): string {
  if (n === 0) return formatMontant(0);
  const abs = formatMontant(Math.abs(n));
  return n < 0 ? `-${abs}` : abs;
}

export async function generateBulletinPaiePdf(
  bulletin: any,
  outputPath: string,
  cumuls?: BulletinCumuls,
): Promise<void> {
  const employe = bulletin.employe || {};
  const { debut, fin } = getPeriodeMois(bulletin.mois, bulletin.annee);

  const brut = Number(bulletin.salaireBrut || 0);
  const appoint = Number(bulletin.montantAppointements || 0);
  const ancien = Number(bulletin.montantAnciennete || 0);
  const cnss = Number(bulletin.cnss || 0);
  const amo = Number(bulletin.amo || 0);
  const ir = Number(bulletin.ir || 0);
  const transport = Number(bulletin.indemniteTransport || 0);
  const net = Number(bulletin.salaireNet || 0);
  const baseIr = round2(brut - cnss - amo);
  const { netArrondi, gainArrondis, retArrondis } = arrondisNet(net);
  const totalGains = round2(brut + transport + Math.max(0, gainArrondis));
  const totalRetenues = round2(
    Number(bulletin.deductions || 0) + Math.max(0, retArrondis),
  );

  const sitFam = employe.situationFamiliale || 'Célibataire';
  const nbEnfants =
    employe.nombreEnfants != null ? String(employe.nombreEnfants) : '0';
  const datePaie = bulletin.datePaie
    ? formatDateDot(new Date(bulletin.datePaie))
    : formatDateDot(new Date());

  const nomSociete = (employe.societe || 'CHIMIRAL - OXYRAL').toUpperCase().replace(/\//g, '-');
  const cnssSociete = SOCIETE_CNSS_DEFAUT;

  // Prepare table rows
  type Row = {
    code: string;
    lib: string;
    base?: string;
    taux?: string;
    gain?: string;
    ret?: string;
    isBold?: boolean;
    isSubtotal?: boolean;
  };

  const rows: Row[] = [
    {
      code: '001',
      lib: 'APPOINTEMENTS DE BASE',
      base: formatJours(Number(bulletin.nombreJours || 26)),
      taux: formatTaux(Number(bulletin.tauxJournalier || 0)),
      gain: formatMontant(appoint),
    },
  ];

  if (Number(bulletin.tauxAnciennete) > 0) {
    rows.push({
      code: '030',
      lib: "PRIME D'ANCIENNETE",
      base: formatMontant(appoint),
      taux: formatTaux(Number(bulletin.tauxAnciennete)),
      gain: formatMontant(ancien),
    });
  }

  if (Number(bulletin.primes) > 0) {
    rows.push({
      code: '020',
      lib: 'PRIMES DIVERSES',
      gain: formatMontant(Number(bulletin.primes)),
    });
  }

  rows.push({
    code: '499',
    lib: 'TOTAL SALAIRE BRUT',
    base: formatMontant(brut),
    gain: formatMontant(brut),
    isBold: true,
    isSubtotal: true,
  });

  rows.push({
    code: '550',
    lib: 'COTISATION C.N.S.S.',
    base: formatMontant(brut),
    taux: '4,480 %',
    ret: formatMontant(cnss),
  });

  rows.push({
    code: '552',
    lib: 'COTISATION A.M.O.',
    base: formatMontant(brut),
    taux: '2,260 %',
    ret: formatMontant(amo),
  });

  rows.push({
    code: '560',
    lib: 'IMPOT SUR LE REVENU (I.R.)',
    base: formatMontant(baseIr),
    ret: ir > 0 ? formatMontant(ir) : '0,00',
  });

  rows.push({
    code: '654',
    lib: 'INDEMNITE DE TRANSPORT URBAIN',
    gain: formatMontant(transport),
  });

  if (gainArrondis !== 0) {
    rows.push({
      code: '997',
      lib: 'ARRONDIS (GAIN)',
      gain: formatMontantSigned(gainArrondis),
    });
  }

  if (retArrondis > 0) {
    rows.push({
      code: '997',
      lib: 'ARRONDIS (RETENUE)',
      ret: formatMontant(retArrondis),
    });
  }

  // PDF Generation using PDFKit
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 35,
      info: {
        Title: `Bulletin de Paie - ${employe.nom || ''} ${employe.prenom || ''} - ${bulletin.mois}.${bulletin.annee}`,
        Author: nomSociete,
      },
    });

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    const margin = 35;
    const topMargin = 75; // Increased top spacing for vertical elegance
    const pageW = 595.28;
    const contentW = pageW - margin * 2; // 525.28

    // Colors
    const primaryColor = '#0F172A'; // Dark Navy Slate
    const accentColor = '#1E3A8A'; // Royal Blue
    const lightBg = '#F8FAFC'; // Soft Light Blue-Grey
    const borderGray = '#CBD5E1'; // Slate Border
    const headerBg = '#1E293B'; // Header Dark Background
    const textDark = '#0F172A'; // Text
    const textMuted = '#475569'; // Secondary text

    // 1. TOP HEADER BANNER (Larger height & top margin)
    const headerH = 80;
    doc.rect(margin, topMargin, contentW, headerH).fill(headerBg);

    // Enlarged LOGO area on the left
    const logoW = 140;
    const logoH = 64;
    const logoX = margin + 10;
    const logoY = topMargin + (headerH - logoH) / 2;

    const logoCandidates = [
      path.join(process.cwd(), 'assets', 'logo-oxyral.png'),
      path.join(process.cwd(), 'assets', 'logo-oxyral-hd.png'),
      path.join(process.cwd(), 'backend', 'assets', 'logo-oxyral.png'),
      path.join(process.cwd(), 'backend', 'assets', 'logo-oxyral-hd.png'),
      path.join(process.cwd(), 'assets', 'logo.png'),
    ];
    const foundLogo = logoCandidates.find((p) => fs.existsSync(p));

    if (foundLogo) {
      try {
        doc.image(foundLogo, logoX, logoY, {
          fit: [logoW, logoH],
          align: 'left',
          valign: 'center',
        });
      } catch (err) {
        console.error('Failed to embed logo image:', err);
      }
    }

    // Centered Title & Header Information (allowing ample room for enlarged logo)
    const headerTextX = margin + logoW + 15;
    const headerTextW = contentW - (logoW + 25);

    const moisNoms = [
      'JANVIER',
      'FÉVRIER',
      'MARS',
      'AVRIL',
      'MAI',
      'JUIN',
      'JUILLET',
      'AOÛT',
      'SEPTEMBRE',
      'OCTOBRE',
      'NOVEMBRE',
      'DÉCEMBRE',
    ];
    const moisNom = moisNoms[(bulletin.mois || 1) - 1] || '';

    // Title centered
    doc
      .fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .fontSize(19)
      .text('BULLETIN DE PAIE', headerTextX, topMargin + 13, {
        width: headerTextW,
        align: 'center',
      });

    // Subtitle / Period centered
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#E2E8F0')
      .text(`PÉRIODE : ${moisNom} ${bulletin.annee}`, headerTextX, topMargin + 37, {
        width: headerTextW,
        align: 'center',
      });

    // Company meta line centered
    doc
      .fontSize(8.5)
      .font('Helvetica')
      .fillColor('#94A3B8')
      .text(
        `Société : ${nomSociete}   -   N° CNSS : ${cnssSociete}   -   Date de paie : ${datePaie}`,
        headerTextX,
        topMargin + 57,
        {
          width: headerTextW,
          align: 'center',
        },
      );

    // 2. SALARY & EMPLOYEE INFORMATION BOX
    let curY = topMargin + headerH + 12;

    // Box Header
    doc.rect(margin, curY, contentW, 20).fill('#E2E8F0');
    doc
      .fillColor(primaryColor)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('INFORMATIONS SALARIÉ & EMPLOI', margin + 10, curY + 5);

    curY += 20;
    const cardHeight = 85;

    // Outer border for card
    doc
      .rect(margin, curY, contentW, cardHeight)
      .fillAndStroke(lightBg, borderGray);

    // Split into 2 columns
    const colW = contentW / 2;

    // Vertical separator
    doc
      .moveTo(margin + colW, curY)
      .lineTo(margin + colW, curY + cardHeight)
      .strokeColor(borderGray)
      .stroke();

    // Column 1 Content
    doc.fillColor(textDark).fontSize(9);
    let lY = curY + 8;
    const lineStep = 15;

    const printField = (
      x: number,
      y: number,
      label: string,
      val: string,
      w = 240,
    ) => {
      doc
        .font('Helvetica-Bold')
        .fillColor(textMuted)
        .text(label, x, y, { width: 100, continued: false });
      doc
        .font('Helvetica-Bold')
        .fillColor(textDark)
        .text(`:  ${val}`, x + 95, y, { width: w - 95 });
    };

    printField(margin + 10, lY, 'Matricule', matricule(employe.id || 0));
    lY += lineStep;
    printField(
      margin + 10,
      lY,
      'Nom & Prénom',
      `${employe.nom || ''} ${employe.prenom || ''}`.toUpperCase(),
    );
    lY += lineStep;
    printField(margin + 10, lY, 'C.I.N.', employe.cin || '-');
    lY += lineStep;
    printField(margin + 10, lY, 'N° C.N.S.S.', employe.cnss || '-');
    lY += lineStep;
    printField(
      margin + 10,
      lY,
      'Sit. Fam. - Enf.',
      `${sitFam} (${nbEnfants} enfant(s))`,
    );

    // Column 2 Content
    lY = curY + 8;
    const xCol2 = margin + colW + 10;
    printField(
      xCol2,
      lY,
      'Fonction',
      (employe.fonction || 'EMPLOYE').toUpperCase(),
    );
    lY += lineStep;
    printField(
      xCol2,
      lY,
      'Date embauche',
      employe.dateEmbauche ? formatDateDot(new Date(employe.dateEmbauche)) : '-',
    );
    lY += lineStep;
    printField(
      xCol2,
      lY,
      'Période (du - au)',
      `${formatDateDot(debut)} au ${formatDateDot(fin)}`,
    );
    lY += lineStep;
    printField(
      xCol2,
      lY,
      'Jours travaillés',
      `${formatJours(Number(bulletin.nombreJours || 26))} jours`,
    );
    lY += lineStep;
    printField(xCol2, lY, 'N° C.I.M.R.', employe.cimr || '-');

    curY += cardHeight + 12;

    // 3. MAIN TABLE OF SALARY COMPONENTS
    const tableHeaderHeight = 22;
    const colCodeW = 45;
    const colLibW = 185;
    const colBaseW = 75;
    const colTauxW = 60;
    const colGainW = 80;
    const colRetW = 80;

    const xCode = margin;
    const xLib = xCode + colCodeW;
    const xBase = xLib + colLibW;
    const xTaux = xBase + colBaseW;
    const xGain = xTaux + colTauxW;
    const xRet = xGain + colGainW;

    // Header row background
    doc.rect(margin, curY, contentW, tableHeaderHeight).fill(accentColor);

    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8.5);

    doc.text('CODE', xCode + 4, curY + 6, {
      width: colCodeW - 8,
      align: 'center',
    });
    doc.text('RUBRIQUE / LIBELLÉ', xLib + 6, curY + 6, { width: colLibW - 12 });
    doc.text('BASE', xBase + 4, curY + 6, {
      width: colBaseW - 8,
      align: 'right',
    });
    doc.text('TAUX', xTaux + 4, curY + 6, {
      width: colTauxW - 8,
      align: 'right',
    });
    doc.text('GAINS (DH)', xGain + 4, curY + 6, {
      width: colGainW - 8,
      align: 'right',
    });
    doc.text('RETENUES (DH)', xRet + 4, curY + 6, {
      width: colRetW - 8,
      align: 'right',
    });

    curY += tableHeaderHeight;

    const rowHeight = 19;
    const minRowsHeight = 209; // Adjusted height for perfect page fit
    let renderedRowsHeight = 0;

    rows.forEach((r, idx) => {
      const isEven = idx % 2 === 0;
      const bg = r.isSubtotal ? '#E2E8F0' : isEven ? '#FFFFFF' : '#F8FAFC';

      doc.rect(margin, curY, contentW, rowHeight).fill(bg);
      doc
        .rect(margin, curY, contentW, rowHeight)
        .strokeColor('#E2E8F0')
        .stroke();

      doc
        .fillColor(r.isBold ? primaryColor : textDark)
        .font(r.isBold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(8.5);

      doc.text(r.code, xCode + 4, curY + 5, {
        width: colCodeW - 8,
        align: 'center',
      });
      doc.text(r.lib, xLib + 6, curY + 5, { width: colLibW - 12 });
      if (r.base)
        doc.text(r.base, xBase + 4, curY + 5, {
          width: colBaseW - 8,
          align: 'right',
        });
      if (r.taux)
        doc.text(r.taux, xTaux + 4, curY + 5, {
          width: colTauxW - 8,
          align: 'right',
        });
      if (r.gain)
        doc.text(r.gain, xGain + 4, curY + 5, {
          width: colGainW - 8,
          align: 'right',
        });
      if (r.ret)
        doc.text(r.ret, xRet + 4, curY + 5, {
          width: colRetW - 8,
          align: 'right',
        });

      curY += rowHeight;
      renderedRowsHeight += rowHeight;
    });

    // Fill remaining table vertical space with blank rows if needed for visual elegance
    while (renderedRowsHeight < minRowsHeight) {
      const isEven =
        (rows.length + Math.floor(renderedRowsHeight / rowHeight)) % 2 === 0;
      const bg = isEven ? '#FFFFFF' : '#F8FAFC';

      doc.rect(margin, curY, contentW, rowHeight).fill(bg);
      doc
        .rect(margin, curY, contentW, rowHeight)
        .strokeColor('#F1F5F9')
        .stroke();

      curY += rowHeight;
      renderedRowsHeight += rowHeight;
    }

    // Outer table vertical grid lines
    doc
      .rect(
        margin,
        curY - renderedRowsHeight - tableHeaderHeight,
        contentW,
        renderedRowsHeight + tableHeaderHeight,
      )
      .strokeColor(borderGray)
      .stroke();

    curY += 10;

    // 4. TOTALS & NET SALARY SUMMARY
    const summaryH = 75;
    doc
      .rect(margin, curY, contentW, summaryH)
      .fillAndStroke('#FFFFFF', borderGray);

    // Left Totals (Total Gains & Total Retenues)
    const leftW = 270;
    doc.fillColor(textDark).fontSize(9);

    // Row 1: Total Gains
    doc.rect(margin + 10, curY + 10, leftW - 20, 22).fill('#F1F5F9');
    doc
      .font('Helvetica-Bold')
      .fillColor(textMuted)
      .text('TOTAL GAINS BRUTS', margin + 18, curY + 16);
    doc
      .font('Helvetica-Bold')
      .fillColor('#16A34A')
      .text(`${formatMontant(totalGains)} DH`, margin + 150, curY + 16, {
        width: leftW - 165,
        align: 'right',
      });

    // Row 2: Total Retenues
    doc.rect(margin + 10, curY + 38, leftW - 20, 22).fill('#F1F5F9');
    doc
      .font('Helvetica-Bold')
      .fillColor(textMuted)
      .text('TOTAL RETENUES', margin + 18, curY + 44);
    doc
      .font('Helvetica-Bold')
      .fillColor('#DC2626')
      .text(`${formatMontant(totalRetenues)} DH`, margin + 150, curY + 44, {
        width: leftW - 165,
        align: 'right',
      });

    // Right Net Box (NET À PAYER)
    const xNetBox = margin + leftW + 10;
    const netBoxW = contentW - leftW - 20;

    doc.rect(xNetBox, curY + 10, netBoxW, 50).fill(primaryColor);

    doc
      .fillColor('#94A3B8')
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('NET À PAYER', xNetBox + 10, curY + 16, {
        width: netBoxW - 20,
        align: 'center',
      });

    doc
      .fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .fontSize(16)
      .text(`${formatMontant(netArrondi)} DH`, xNetBox + 10, curY + 33, {
        width: netBoxW - 20,
        align: 'center',
      });

    curY += summaryH + 10;

    // 5. MONTANT EN LETTRES BOX
    const netEnLettres = montantEnLettresDirhams(netArrondi);
    doc.rect(margin, curY, contentW, 26).fillAndStroke('#F8FAFC', borderGray);

    doc
      .fillColor(textMuted)
      .font('Helvetica-Oblique')
      .fontSize(8.5)
      .text(
        'Arrêté le présent bulletin de paie à la somme de :',
        margin + 10,
        curY + 7,
      );

    doc
      .fillColor(primaryColor)
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .text(netEnLettres, margin + 215, curY + 7, { width: contentW - 225 });

    curY += 34;

    // 6. CUMULS TABLE
    if (cumuls) {
      doc
        .font('Helvetica-Bold')
        .fillColor(primaryColor)
        .fontSize(8.5)
        .text(`CUMULS DE L'ANNÉE ${bulletin.annee}`, margin, curY);

      curY += 12;

      const cumHHeight = 18;
      const cumW = contentW / 5;

      doc.rect(margin, curY, contentW, cumHHeight).fill('#334155');
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(7.5);

      const cumHeaders = [
        'JOURS IR',
        'CUMUL BRUT IMP.',
        'CUMUL RETENUES',
        'CUMUL DÉDUCTIONS',
        'CUMUL I.R.',
      ];

      cumHeaders.forEach((h, i) => {
        doc.text(h, margin + i * cumW, curY + 5, {
          width: cumW,
          align: 'center',
        });
      });

      curY += cumHHeight;

      doc
        .rect(margin, curY, contentW, 18)
        .fillAndStroke('#FFFFFF', borderGray);
      doc.fillColor(textDark).font('Helvetica').fontSize(8);

      const cumVals = [
        formatJours(cumuls.joursIr),
        formatMontant(cumuls.cumulBaseImposable),
        formatMontant(cumuls.cumulRetenues),
        formatMontant(cumuls.cumulDeductions),
        cumuls.cumulRetenuesIr > 0
          ? formatMontant(cumuls.cumulRetenuesIr)
          : '0,00',
      ];

      cumVals.forEach((v, i) => {
        doc.text(v, margin + i * cumW, curY + 5, {
          width: cumW,
          align: 'center',
        });
      });

      curY += 26;
    } else {
      curY += 10;
    }

    // 7. SIGNATURES BLOCK
    const sigBoxH = 60;
    const sigW = (contentW - 20) / 2;

    // Left Signature: Employeur
    doc.rect(margin, curY, sigW, sigBoxH).fillAndStroke('#FFFFFF', borderGray);
    doc
      .fillColor(textMuted)
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .text("Signature & Cachet de l'Employeur", margin + 10, curY + 8);

    // Right Signature: Salarié
    doc
      .rect(margin + sigW + 20, curY, sigW, sigBoxH)
      .fillAndStroke('#FFFFFF', borderGray);
    doc
      .fillColor(textMuted)
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .text('Émargement du Salarié', margin + sigW + 30, curY + 8);

    // Finalize PDF document
    doc.end();

    stream.on('finish', () => resolve());
    stream.on('error', (err) => reject(err));
  });
}
