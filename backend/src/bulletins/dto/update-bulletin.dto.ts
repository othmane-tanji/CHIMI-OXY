import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdateBulletinDto {
  @IsOptional()
  @IsNumber()
  salaireBase?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(26)
  nombreJours?: number;

  @IsOptional()
  @IsNumber()
  primes?: number;

  @IsOptional()
  @IsNumber()
  indemniteTransport?: number;

  @IsOptional()
  @IsNumber()
  ir?: number;

  @IsOptional()
  confirmerAvertissement?: boolean;
}
