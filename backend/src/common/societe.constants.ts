export const SOCIETES = ['OXYRAL', 'CHIMIRAL'] as const;
export type SocieteType = (typeof SOCIETES)[number];
