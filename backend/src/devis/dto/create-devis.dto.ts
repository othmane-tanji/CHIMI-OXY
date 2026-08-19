import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DevisLigneDto {
  @IsString()
  designation: string;

  @IsNumber()
  @Min(0)
  nbSeaux: number;

  @IsNumber()
  @Min(0)
  qtySeauKg: number;

  @IsNumber()
  @Min(0)
  prixUnitaire: number;
}

export class CreateDevisDto {
  @IsString()
  numeroDevisMiddle: string;

  @IsOptional()
  @IsDateString()
  dateDevis?: string;

  @IsString()
  clientNom: string;

  @IsString()
  objet: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DevisLigneDto)
  lignes: DevisLigneDto[];
}
