export function getMoisAnciennete(
  dateEmbauche: Date,
  reference: Date = new Date(),
): number {
  let months =
    (reference.getFullYear() - dateEmbauche.getFullYear()) * 12 +
    (reference.getMonth() - dateEmbauche.getMonth());
  if (reference.getDate() < dateEmbauche.getDate()) months--;
  return Math.max(0, months);
}

/** 0j (<6 mois) · 9j/an (≥6 mois et <1 an) · 18j/an (≥1 an) */
export function getDroitAnnuel(
  dateEmbauche: Date,
  reference: Date = new Date(),
): number {
  if (getMoisAnciennete(dateEmbauche, reference) < 6) return 0;

  const unAn = new Date(dateEmbauche);
  unAn.setFullYear(unAn.getFullYear() + 1);
  return reference >= unAn ? 18 : 9;
}

export function isDimanche(date: Date): boolean {
  return date.getDay() === 0;
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
