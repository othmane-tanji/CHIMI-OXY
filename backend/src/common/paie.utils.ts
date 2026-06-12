export const JOURS_APPOINTEMENT_BASE = 26;
export const CNSS_TAUX = 4.48;
export const AMO_TAUX = 2.26;
export const INDEMNITE_TRANSPORT_DEFAUT = 150;

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function getAnneesAnciennete(dateEmbauche: Date, reference: Date = new Date()): number {
  let years = reference.getFullYear() - dateEmbauche.getFullYear();
  const m = reference.getMonth() - dateEmbauche.getMonth();
  if (m < 0 || (m === 0 && reference.getDate() < dateEmbauche.getDate())) years--;
  return Math.max(0, years);
}

/** 2 ans et plus : +5 % · 5 ans et plus : +10 % (droit marocain) */
export function getTauxAnciennete(dateEmbauche: Date, reference: Date = new Date()): number {
  const years = getAnneesAnciennete(dateEmbauche, reference);
  if (years >= 5) return 10;
  if (years >= 2) return 5;
  return 0;
}

export function getPeriodeMois(mois: number, annee: number) {
  const debut = new Date(annee, mois - 1, 1);
  const fin = new Date(annee, mois, 0);
  return { debut, fin };
}

export function formatDateFr(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export interface CalculBulletinInput {
  salaireBase: number;
  nombreJours: number;
  joursAbsents: number;
  dateEmbauche: Date;
  mois: number;
  annee: number;
  primes?: number;
  indemniteTransport?: number;
  ir?: number;
}

export interface CalculBulletinResult {
  joursAttendus: number;
  avertissement: string | null;
  tauxJournalier: number;
  montantAppointements: number;
  tauxAnciennete: number;
  anneesAnciennete: number;
  montantAnciennete: number;
  salaireBrut: number;
  cnss: number;
  amo: number;
  ir: number;
  indemniteTransport: number;
  primes: number;
  totalGains: number;
  totalRetenues: number;
  salaireNet: number;
}

export function calculerBulletin(input: CalculBulletinInput): CalculBulletinResult {
  const joursAttendus = JOURS_APPOINTEMENT_BASE - input.joursAbsents;
  const avertissement =
    input.nombreJours !== joursAttendus
      ? `Cet employé a ${input.joursAbsents} jour(s) d'absence ce mois. ` +
        `Le nombre d'appointements attendu est ${joursAttendus} jour(s) ` +
        `(26 − ${input.joursAbsents}), pas ${input.nombreJours}.`
      : null;

  const { fin } = getPeriodeMois(input.mois, input.annee);
  const tauxJournalier = round2(input.salaireBase / JOURS_APPOINTEMENT_BASE);
  const montantAppointements = round2(input.nombreJours * tauxJournalier);
  const tauxAnciennete = getTauxAnciennete(input.dateEmbauche, fin);
  const anneesAnciennete = getAnneesAnciennete(input.dateEmbauche, fin);
  const montantAnciennete = round2(montantAppointements * (tauxAnciennete / 100));
  const primes = input.primes || 0;
  const salaireBrut = round2(montantAppointements + montantAnciennete + primes);
  const cnss = round2(salaireBrut * (CNSS_TAUX / 100));
  const amo = round2(salaireBrut * (AMO_TAUX / 100));
  const ir = input.ir || 0;
  const indemniteTransport = input.indemniteTransport ?? INDEMNITE_TRANSPORT_DEFAUT;
  const totalRetenues = round2(cnss + amo + ir);
  const totalGains = round2(salaireBrut + indemniteTransport);
  const salaireNet = round2(totalGains - totalRetenues);

  return {
    joursAttendus,
    avertissement,
    tauxJournalier,
    montantAppointements,
    tauxAnciennete,
    anneesAnciennete,
    montantAnciennete,
    salaireBrut,
    cnss,
    amo,
    ir,
    indemniteTransport,
    primes,
    totalGains,
    totalRetenues,
    salaireNet,
  };
}

export function formatMontant(n: number): string {
  return n.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatTaux(n: number): string {
  return n.toLocaleString('fr-FR', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

export function formatJours(n: number): string {
  return n.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
