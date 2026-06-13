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
  return n.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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

export function formatNumeroFacture(annee: number, sequence: number): string {
  return `${annee}/${String(sequence).padStart(3, '0')}`;
}
