import { round2 } from './paie.utils';
import { montantEnLettresDirhams } from './montant-lettres.utils';

export const TVA_TAUX = 0.2;

export interface FactureLigneInput {
  designation: string;
  quantite: number;
  prixUnitaire: number;
}

export interface FactureLigneCalc extends FactureLigneInput {
  montantHt: number;
}

export interface FactureTotaux {
  lignes: FactureLigneCalc[];
  totalHt: number;
  totalTva: number;
  totalTtc: number;
  montantEnLettres: string;
}

export function formatMontantFacture(n: number): string {
  if (n === null || n === undefined || isNaN(n)) return '0,00';
  const parts = Number(n).toFixed(2).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${integerPart},${parts[1]}`;
}

export function formatDateFacture(date: Date | string): string {
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function calculerFactureVente(lignes: FactureLigneInput[]): FactureTotaux {
  const lignesCalc = lignes.map((l) => ({
    ...l,
    montantHt: round2(l.quantite * l.prixUnitaire),
  }));
  const totalHt = round2(lignesCalc.reduce((s, l) => s + l.montantHt, 0));
  const totalTva = round2(totalHt * TVA_TAUX);
  const totalTtc = round2(totalHt + totalTva);
  return {
    lignes: lignesCalc,
    totalHt,
    totalTva,
    totalTtc,
    montantEnLettres: montantEnLettresDirhams(totalTtc),
  };
}

export function formatNumeroFacture(
  annee: number,
  sequence: number,
  societe: string = 'OXYRAL',
  dateFacture?: Date | string
): string {
  const isChimiral = (societe || '').toUpperCase() === 'CHIMIRAL';
  if (isChimiral) {
    const d = dateFacture ? new Date(dateFacture) : new Date();
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${yy}${mm}-${String(sequence).padStart(3, '0')}`;
  }
  return `${annee}/${String(sequence).padStart(3, '0')}`;
}
