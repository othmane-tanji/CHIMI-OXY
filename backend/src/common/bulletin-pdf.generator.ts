import * as fs from 'fs';
import * as path from 'path';
import sharp = require('sharp');
import { PDFDocument } from 'pdf-lib';
import {
  formatDateFr,
  formatJours,
  formatMontant,
  formatTaux,
  getPeriodeMois,
  round2,
} from './paie.utils';

/** Modèle vierge recadré — pixels réels de template-form.png */
const TEMPLATE_FORM = path.join(process.cwd(), 'assets', 'template-form.png');
const IMG_W = 723;
const IMG_H = 952;
const PAGE_W = 595.276;
const PAGE_H = 841.89;
const SOCIETE_CNSS = '8229149';

export interface BulletinCumuls {
  joursIr: number;
  cumulBaseImposable: number;
  cumulRetenues: number;
  cumulDeductions: number;
  cumulRetenuesIr: number;
}

/** Coordonnées en pixels sur template-form.png (origine haut-gauche) */
const F = {
  cnss: { x: 104, y: 83 },
  periodeDu: { x: 521, y: 117, w: 89 },
  periodeAu: { x: 622, y: 117, w: 88 },
  matricule: { x: 15, y: 204, w: 77 },
  nom: { x: 159, y: 204 },
  fonction: { x: 336, y: 202, w: 202 },
  paie1: { x: 538, y: 211, w: 35 },
  depart: { x: 573, y: 211, w: 42 },
  sect: { x: 615, y: 211, w: 45 },
  categ: { x: 660, y: 211, w: 42 },
  adresse: { x: 108, y: 235 },
  naissance: { x: 3, y: 315, w: 102 },
  embauche: { x: 105, y: 315, w: 103 },
  paie2: { x: 208, y: 315, w: 102 },
  sitFam: { x: 310, y: 315, w: 82 },
  ch: { x: 392, y: 315, w: 39 },
  cin: { x: 431, y: 315, w: 90 },
  cnssEmp: { x: 521, y: 315, w: 102 },
  cimr: { x: 623, y: 315, w: 99 },
  table: {
    y0: 393,
    step: 25,
    code: 54,
    lib: 98,
    base: 417,
    taux: 486,
    gain: 598,
    ret: 700,
  },
  dec: { y: 780, xs: [121, 164, 207, 250, 290, 329, 368] },
  totalGain: { x: 483, y: 755, w: 104 },
  totalRet: { x: 606, y: 758, w: 94 },
  net: { x: 505, y: 781, w: 206 },
  cumuls: { y: 850, xs: [3, 95, 260, 411, 552], ws: [92, 165, 151, 141, 155] },
};

function matricule(id: number): string {
  return String(id).padStart(5, '0');
}

function esc(text: string): string {
  return text
    .replace(/[\u202f\u00a0]/g, ' ')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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

function decompteMonetaire(montant: number): number[] {
  const vals = [200, 100, 50, 20, 10, 5, 1];
  let rest = round2(montant);
  return vals.map((v) => {
    const c = Math.floor(rest / v);
    rest = round2(rest - c * v);
    return c;
  });
}

function svgText(
  text: string,
  x: number,
  y: number,
  opts: { size?: number; weight?: string; anchor?: 'start' | 'middle' | 'end'; width?: number } = {},
): string {
  if (!text) return '';
  const size = opts.size ?? 12;
  const anchor = opts.anchor ?? 'start';
  let px = x;
  if (anchor === 'middle' && opts.width) px = x + opts.width / 2;
  if (anchor === 'end') px = x;
  return `<text x="${px}" y="${y + size}" font-family="Times New Roman,serif" font-size="${size}" font-weight="${opts.weight ?? 'normal'}" text-anchor="${anchor}" fill="#000">${esc(text)}</text>`;
}

function svgBox(
  text: string,
  x: number,
  y: number,
  w: number,
  size = 12,
): string {
  return svgText(text, x, y, { size, anchor: 'middle', width: w });
}

export async function generateBulletinPaiePdf(
  bulletin: any,
  outputPath: string,
  cumuls?: BulletinCumuls,
): Promise<void> {
  const employe = bulletin.employe;
  const { debut, fin } = getPeriodeMois(bulletin.mois, bulletin.annee);

  if (!fs.existsSync(TEMPLATE_FORM)) {
    throw new Error(`Modèle introuvable : ${TEMPLATE_FORM}. Exécutez: node scripts/prepare-template-form.js`);
  }

  const brut = Number(bulletin.salaireBrut);
  const appoint = Number(bulletin.montantAppointements);
  const ancien = Number(bulletin.montantAnciennete);
  const cnss = Number(bulletin.cnss);
  const amo = Number(bulletin.amo);
  const ir = Number(bulletin.ir);
  const transport = Number(bulletin.indemniteTransport);
  const net = Number(bulletin.salaireNet);
  const baseIr = round2(brut - cnss - amo);
  const { netArrondi, gainArrondis, retArrondis } = arrondisNet(net);
  const totalGains = round2(brut + transport + gainArrondis);
  const totalRetenues = round2(Number(bulletin.deductions) + Math.max(0, retArrondis));

  const sitFam = employe.situationFamiliale || '-';
  const nbEnfants = employe.nombreEnfants != null ? String(employe.nombreEnfants) : '-';
  const datePaie = bulletin.datePaie ? formatDateFr(new Date(bulletin.datePaie)) : formatDateFr(new Date());

  type Row = { code: string; lib: string; base?: string; taux?: string; gain?: string; ret?: string };
  const rows: Row[] = [
    {
      code: '001',
      lib: 'APPOINTEMENTS',
      base: formatJours(Number(bulletin.nombreJours)),
      taux: formatTaux(Number(bulletin.tauxJournalier)),
      gain: formatMontant(appoint),
    },
  ];
  if (Number(bulletin.tauxAnciennete) > 0) {
    rows.push({
      code: '030',
      lib: 'ANCIENNETE',
      base: formatMontant(appoint),
      taux: formatTaux(Number(bulletin.tauxAnciennete)),
      gain: formatMontant(ancien),
    });
  }
  if (Number(bulletin.primes) > 0) {
    rows.push({ code: '020', lib: 'PRIMES', gain: formatMontant(Number(bulletin.primes)) });
  }
  rows.push({ code: '499', lib: 'SALAIRE BRUT', base: formatMontant(brut) });
  rows.push({ code: '550', lib: 'C.N.S.S.', base: formatMontant(brut), taux: '4,480', ret: formatMontant(cnss) });
  rows.push({ code: '552', lib: 'A.M.C', base: formatMontant(brut), taux: '2,260', ret: formatMontant(amo) });
  rows.push({ code: '560', lib: 'I.R', base: formatMontant(baseIr), ret: ir > 0 ? formatMontant(ir) : undefined });
  rows.push({ code: '654', lib: 'INDEMNITE DE TRANSPORT URBAIN', gain: formatMontant(transport) });
  if (gainArrondis !== 0) rows.push({ code: '997', lib: 'ARRONDIS', gain: formatMontantSigned(gainArrondis) });
  if (retArrondis > 0) rows.push({ code: '997', lib: 'ARRONDIS', ret: formatMontant(retArrondis) });

  const parts: string[] = [];
  parts.push(svgText(SOCIETE_CNSS, F.cnss.x, F.cnss.y));
  parts.push(svgBox(formatDateFr(debut), F.periodeDu.x, F.periodeDu.y, F.periodeDu.w));
  parts.push(svgBox(formatDateFr(fin), F.periodeAu.x, F.periodeAu.y, F.periodeAu.w));
  parts.push(svgBox(matricule(employe.id), F.matricule.x, F.matricule.y, F.matricule.w));
  parts.push(svgText(`${employe.nom} ${employe.prenom}`.toUpperCase(), F.nom.x, F.nom.y, { weight: 'bold' }));
  parts.push(svgBox((employe.fonction || 'EMPLOYE').toUpperCase(), F.fonction.x, F.fonction.y, F.fonction.w));
  parts.push(svgBox('01', F.paie1.x, F.paie1.y, F.paie1.w));
  parts.push(svgBox('01', F.depart.x, F.depart.y, F.depart.w));
  parts.push(svgBox('0002', F.sect.x, F.sect.y, F.sect.w));
  parts.push(svgBox('01', F.categ.x, F.categ.y, F.categ.w));
  parts.push(svgText(employe.adresse || '-', F.adresse.x, F.adresse.y));
  parts.push(
    svgBox(employe.dateNaissance ? formatDateFr(new Date(employe.dateNaissance)) : '-', F.naissance.x, F.naissance.y, F.naissance.w),
  );
  parts.push(svgBox(formatDateFr(new Date(employe.dateEmbauche)), F.embauche.x, F.embauche.y, F.embauche.w));
  parts.push(svgBox(datePaie, F.paie2.x, F.paie2.y, F.paie2.w));
  parts.push(svgBox(sitFam, F.sitFam.x, F.sitFam.y, F.sitFam.w));
  parts.push(svgBox(nbEnfants, F.ch.x, F.ch.y, F.ch.w));
  parts.push(svgBox(employe.cin, F.cin.x, F.cin.y, F.cin.w));
  parts.push(svgBox(employe.cnss || '-', F.cnssEmp.x, F.cnssEmp.y, F.cnssEmp.w));
  parts.push(svgBox(employe.cimr || '-', F.cimr.x, F.cimr.y, F.cimr.w));

  rows.forEach((r, i) => {
    const y = F.table.y0 + i * F.table.step;
    parts.push(svgText(r.code, F.table.code, y, { anchor: 'middle' }));
    parts.push(svgText(r.lib, F.table.lib, y));
    if (r.base) parts.push(svgText(r.base, F.table.base, y, { anchor: 'end' }));
    if (r.taux) parts.push(svgText(r.taux, F.table.taux, y, { anchor: 'end' }));
    if (r.gain) parts.push(svgText(r.gain, F.table.gain, y, { anchor: 'end' }));
    if (r.ret) parts.push(svgText(r.ret, F.table.ret, y, { anchor: 'end' }));
  });

  decompteMonetaire(netArrondi).forEach((count, i) => {
    if (count > 0) parts.push(svgBox(String(count), F.dec.xs[i] - 10, F.dec.y, 20));
  });

  parts.push(svgText(formatMontant(totalGains), F.totalGain.x + F.totalGain.w, F.totalGain.y, { anchor: 'end' }));
  parts.push(svgText(formatMontant(totalRetenues), F.totalRet.x + F.totalRet.w, F.totalRet.y, { anchor: 'end' }));
  parts.push(svgBox(formatMontant(netArrondi), F.net.x, F.net.y, F.net.w, 14));

  if (cumuls) {
    const vals = [
      formatJours(cumuls.joursIr),
      formatMontant(cumuls.cumulBaseImposable),
      formatMontant(cumuls.cumulRetenues),
      formatMontant(cumuls.cumulDeductions),
      cumuls.cumulRetenuesIr > 0 ? formatMontant(cumuls.cumulRetenuesIr) : '',
    ];
    vals.forEach((v, i) => {
      if (v) parts.push(svgBox(v, F.cumuls.xs[i], F.cumuls.y, F.cumuls.ws[i]));
    });
  }

  const svg = `<svg width="${IMG_W}" height="${IMG_H}" xmlns="http://www.w3.org/2000/svg">${parts.join('')}</svg>`;
  const composed = await sharp(TEMPLATE_FORM)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toBuffer();

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  const png = await pdfDoc.embedPng(composed);
  page.drawImage(png, { x: 0, y: 0, width: PAGE_W, height: PAGE_H });
  fs.writeFileSync(outputPath, await pdfDoc.save());
}
