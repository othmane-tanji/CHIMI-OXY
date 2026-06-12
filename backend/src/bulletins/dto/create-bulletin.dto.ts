import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class CreateBulletinDto {
  @IsInt()
  employeId: number;

  @IsInt()
  @Min(1)
  @Max(12)
  mois: number;

  @IsInt()
  @Min(2000)
  annee: number;

  /** Salaire mensuel de référence pour 26 jours */
  @IsNumber()
  salaireBase: number;

  @IsInt()
  @Min(1)
  @Max(26)
  nombreJours: number;

  @IsOptional()
  @IsNumber()
  primes?: number;

  @IsOptional()
  @IsNumber()
  indemniteTransport?: number;

  @IsOptional()
  @IsNumber()
  ir?: number;

  /** Ignorer l'avertissement jours / absences */
  @IsOptional()
  confirmerAvertissement?: boolean;
}
