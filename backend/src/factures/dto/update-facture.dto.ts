import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

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
