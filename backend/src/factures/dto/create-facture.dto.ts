import { IsDateString, IsInt, IsNumber, IsString } from 'class-validator';

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

export class CreateFactureVenteDto {
  @IsInt()
  clientId: number;

  @IsString()
  numeroFacture: string;

  @IsDateString()
  dateFacture: string;

  @IsNumber()
  montant: number;
}
