import { IsIn, IsOptional, IsString } from 'class-validator';
import { SOCIETES, SocieteType } from '../../common/societe.constants';

export class UpdateFournisseurDto {
  @IsOptional()
  @IsString()
  nomFournisseur?: string;

  @IsOptional()
  @IsIn(SOCIETES)
  societe?: SocieteType;
}
