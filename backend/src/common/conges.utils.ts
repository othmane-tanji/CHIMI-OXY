export function getDroitAnnuel(dateEmbauche: Date): number {
  const now = new Date();
  const unAn = new Date(dateEmbauche);
  unAn.setFullYear(unAn.getFullYear() + 1);
  return now >= unAn ? 18 : 9;
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
