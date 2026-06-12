import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateTraiteDto {
  @IsOptional()
  @IsNumber()
  montant?: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  reference?: string;
}
