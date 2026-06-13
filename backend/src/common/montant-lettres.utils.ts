const UNITS = [
  '',
  'UN',
  'DEUX',
  'TROIS',
  'QUATRE',
  'CINQ',
  'SIX',
  'SEPT',
  'HUIT',
  'NEUF',
  'DIX',
  'ONZE',
  'DOUZE',
  'TREIZE',
  'QUATORZE',
  'QUINZE',
  'SEIZE',
  'DIX-SEPT',
  'DIX-HUIT',
  'DIX-NEUF',
];

function underHundred(n: number): string {
  if (n < 20) return UNITS[n];
  if (n < 70) {
    const d = Math.floor(n / 10);
    const u = n % 10;
    const tens = d === 7 ? 'SOIXANTE' : d === 9 ? 'QUATRE-VINGT' : `${UNITS[d]}${d === 8 ? '' : '-'}${d === 8 ? 'QUATRE-VINGT' : 'DIX'}`;
    if (d === 7 && u > 0) return `SOIXANTE-${underHundred(10 + u)}`;
    if (d === 9 && u > 0) return `QUATRE-VINGT-${underHundred(10 + u)}`;
    if (u === 0) return tens;
    if (d === 8) return `QUATRE-VINGT-${UNITS[u]}`;
    return `${tens}-${UNITS[u]}`;
  }
  if (n < 80) return n === 71 ? 'SOIXANTE ET ONZE' : `SOIXANTE-${underHundred(n - 60)}`;
  const u = n - 80;
  if (u === 0) return 'QUATRE-VINGTS';
  return `QUATRE-VINGT-${underHundred(u)}`;
}

function underThousand(n: number): string {
  if (n === 0) return '';
  if (n < 100) return underHundred(n);
  const h = Math.floor(n / 100);
  const r = n % 100;
  const hundred =
    h === 1 ? 'CENT' : `${UNITS[h]} CENT${r === 0 && h > 1 ? 'S' : ''}`;
  return r ? `${hundred} ${underHundred(r)}` : hundred;
}

export function nombreEnLettres(n: number): string {
  if (n === 0) return 'ZERO';
  if (n < 0) return `MOINS ${nombreEnLettres(-n)}`;

  const parts: string[] = [];
  const millions = Math.floor(n / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1000);
  const rest = n % 1000;

  if (millions) {
    parts.push(
      millions === 1 ? 'UN MILLION' : `${underThousand(millions)} MILLIONS`,
    );
  }
  if (thousands) {
    parts.push(
      thousands === 1 ? 'MILLE' : `${underThousand(thousands)} MILLE`,
    );
  }
  if (rest) parts.push(underThousand(rest));

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

export function montantEnLettresDirhams(montant: number): string {
  const entiers = Math.floor(Math.abs(montant));
  const centimes = Math.round((Math.abs(montant) - entiers) * 100);
  const mots = nombreEnLettres(entiers);
  const cts = String(centimes).padStart(2, '0');
  return `${mots} DIRHAMS ET ${cts} CTS.`;
}
