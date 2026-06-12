import { IsDateString, IsInt, IsNumber, IsString } from 'class-validator';

export class CreateEncaissementDto {
  @IsInt()
  clientId: number;

  @IsNumber()
  montant: number;

  @IsDateString()
  date: string;

  @IsString()
  reference: string;
}

export class CreateDecaissementDto {
  @IsInt()
  fournisseurId: number;

  @IsNumber()
  montant: number;

  @IsDateString()
  date: string;

  @IsString()
  reference: string;
}
