import {
  IsArray,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFactureAchatDto {
  @IsInt()
  fournisseurId: number;

  @IsString()
  numeroFacture: string;

  @IsDateString()
  dateFacture: string;

  @IsNumber()
  montant: number;
}

export class FactureLigneDto {
  @IsString()
  designation: string;

  @IsNumber()
  @Min(0)
  quantite: number;

  @IsNumber()
  @Min(0)
  prixUnitaire: number;
}

export class CreateFactureVenteDto {
  @IsOptional()
  @IsInt()
  clientId?: number;

  @IsOptional()
  @IsString()
  societe?: string;

  @IsOptional()
  @IsString()
  numeroFacture?: string;

  @IsDateString()
  dateFacture: string;

  @IsOptional()
  @IsString()
  telephone?: string;

  @IsOptional()
  @IsString()
  mail?: string;

  @IsString()
  clientNom: string;

  @IsOptional()
  @IsString()
  clientAdresse?: string;

  @IsOptional()
  @IsString()
  clientIce?: string;

  @IsOptional()
  @IsString()
  codeClient?: string;

  @IsOptional()
  @IsString()
  bonCommande?: string;

  @IsOptional()
  @IsString()
  numeroAttach?: string;

  @IsOptional()
  @IsString()
  conditionPaiement?: string;

  @IsOptional()
  @IsString()
  chantier?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FactureLigneDto)
  lignes: FactureLigneDto[];
}

export class UpdateFactureConfigDto {
  @IsInt()
  @Min(1)
  sequence: number;
}
