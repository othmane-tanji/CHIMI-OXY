import { IsIn, IsString } from 'class-validator';
import { SOCIETES, SocieteType } from '../../common/societe.constants';

export class CreateFournisseurDto {
  @IsString()
  nomFournisseur: string;

  @IsIn(SOCIETES)
  societe: SocieteType;
}
