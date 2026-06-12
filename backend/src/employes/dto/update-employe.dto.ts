import { IsDateString, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { SOCIETES, SocieteType } from '../../common/societe.constants';

export class UpdateEmployeDto {
  @IsOptional()
  @IsString()
  nom?: string;

  @IsOptional()
  @IsString()
  prenom?: string;

  @IsOptional()
  @IsString()
  cin?: string;

  @IsOptional()
  @IsString()
  telephone?: string;

  @IsOptional()
  @IsString()
  adresse?: string;

  @IsOptional()
  @IsDateString()
  dateNaissance?: string;

  @IsOptional()
  @IsString()
  fonction?: string;

  @IsOptional()
  @IsString()
  situationFamiliale?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  nombreEnfants?: number;

  @IsOptional()
  @IsString()
  cnss?: string;

  @IsOptional()
  @IsString()
  cimr?: string;

  @IsOptional()
  @IsDateString()
  dateEmbauche?: string;

  @IsOptional()
  @IsIn(SOCIETES)
  societe?: SocieteType;
}
