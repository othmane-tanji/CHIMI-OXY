export function getMoisAnciennete(
  dateEmbauche: Date,
  reference: Date = new Date(),
): number {
  const dEmbauche = new Date(dateEmbauche);
  let months =
    (reference.getFullYear() - dEmbauche.getFullYear()) * 12 +
    (reference.getMonth() - dEmbauche.getMonth());
  if (reference.getDate() < dEmbauche.getDate()) months--;
  return Math.max(0, months);
}

/**
 * Calcul du droit annuel de congé (Législation Marocaine - Code du Travail) :
 * - < 6 mois d'ancienneté : 0 jour
 * - ≥ 6 mois et < 1 an : 9 jours
 * - ≥ 1 an d'ancienneté : 18 jours de base
 * - Majoration pour ancienneté : +1.5 jour supplémentaire pour chaque tranche de 5 ans d'ancienneté (ex: ≥5 ans -> 19.5j, ≥10 ans -> 21j)
 */
export function getDroitAnnuel(
  dateEmbauche: Date,
  reference: Date = new Date(),
): number {
  const mois = getMoisAnciennete(dateEmbauche, reference);
  if (mois < 6) return 0;
  if (mois < 12) return 9;

  let droit = 18;
  const anneesService = Math.floor(mois / 12);
  if (anneesService >= 5) {
    const tranches5ans = Math.floor(anneesService / 5);
    droit += tranches5ans * 1.5;
  }
  return droit;
}

export function isDimanche(date: Date): boolean {
  return new Date(date).getDay() === 0;
}

export function normaliserDate(date: Date | string): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isCongeEnCours(date: Date): boolean {
  const now = normaliserDate(new Date());
  return normaliserDate(date).getTime() === now.getTime();
}

export function debutMois(mois: number, annee: number): Date {
  return new Date(annee, mois - 1, 1);
}

export function finMois(mois: number, annee: number): Date {
  return new Date(annee, mois, 0, 23, 59, 59, 999);
}
