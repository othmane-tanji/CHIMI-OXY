import { IsIn, IsOptional, IsString } from 'class-validator';
import { SOCIETES, SocieteType } from '../../common/societe.constants';

export class CreateClientDto {
  @IsString()
  nomClient: string;

  @IsIn(SOCIETES)
  societe: SocieteType;

  @IsOptional()
  @IsString()
  adresse?: string;

  @IsOptional()
  @IsString()
  ville?: string;

  @IsOptional()
  @IsString()
  ice?: string;
}
