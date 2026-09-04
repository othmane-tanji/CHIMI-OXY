export const TVA_TAUX = 0.2;

export interface FactureLigneForm {
  designation: string;
  quantite: string;
  prixUnitaire: string;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function formatMontantFacture(n: number): string {
  if (n === null || n === undefined || isNaN(n)) return '0,00';
  const parts = Number(n).toFixed(2).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${integerPart},${parts[1]}`;
}

export function parseNum(value: string): number {
  const n = parseFloat(value.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

export function calculerLigne(quantite: string, prixUnitaire: string): number {
  return round2(parseNum(quantite) * parseNum(prixUnitaire));
}

export function calculerTotaux(lignes: FactureLigneForm[]) {
  const lignesCalc = lignes.map((l) => ({
    ...l,
    montantHt: calculerLigne(l.quantite, l.prixUnitaire),
  }));
  const totalHt = round2(lignesCalc.reduce((s, l) => s + l.montantHt, 0));
  const totalTva = round2(totalHt * TVA_TAUX);
  const totalTtc = round2(totalHt + totalTva);
  return { lignesCalc, totalHt, totalTva, totalTtc };
}

export const emptyLigne = (): FactureLigneForm => ({
  designation: '',
  quantite: '',
  prixUnitaire: '',
});

export const DEFAULTS_VENTE = {
  codeClient: 'OX704',
  telephone: '0662 176 292',
  mail: 'contact@oxyral.ma',
};

export const DEFAULTS_VENTE_CHIMIRAL = {
  codeClient: 'CH704',
  telephone: '06 62 17 62 92',
  mail: 'chimiral2010@gmail.com',
};

