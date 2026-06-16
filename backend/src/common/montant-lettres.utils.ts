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
const TENS = [
  '',
  'DIX',
  'VINGT',
  'TRENTE',
  'QUARANTE',
  'CINQUANTE',
  'SOIXANTE',
  'SOIXANTE',
  'QUATRE-VINGT',
  'QUATRE-VINGT',
];

function underHundred(n: number): string {
  if (n < 20) return UNITS[n];
  const d = Math.floor(n / 10);
  const u = n % 10;

  if (d === 7) {
    if (u === 1) return 'SOIXANTE ET ONZE';
    return `SOIXANTE-${UNITS[10 + u]}`;
  }

  if (d === 8) {
    if (u === 0) return 'QUATRE-VINGTS';
    return `QUATRE-VINGT-${UNITS[u]}`;
  }

  if (d === 9) {
    return `QUATRE-VINGT-${UNITS[10 + u]}`;
  }

  if (u === 0) return TENS[d];
  if (u === 1) return `${TENS[d]} ET UN`;
  return `${TENS[d]}-${UNITS[u]}`;
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
