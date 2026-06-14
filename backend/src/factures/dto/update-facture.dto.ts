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
import { FactureLigneDto } from './create-facture.dto';

export class UpdateFactureDto {
  @IsOptional()
  @IsString()
  numeroFacture?: string;

  @IsOptional()
  @IsDateString()
  dateFacture?: string;

  @IsOptional()
  @IsNumber()
  montant?: number;
}

export class UpdateFactureVenteDto {
  @IsOptional()
  @IsString()
  numeroFacture?: string;

  @IsOptional()
  @IsDateString()
  dateFacture?: string;

  @IsOptional()
  @IsString()
  telephone?: string;

  @IsOptional()
  @IsString()
  mail?: string;

  @IsOptional()
  @IsString()
  clientNom?: string;

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
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FactureLigneDto)
  lignes?: FactureLigneDto[];
}
