import { IsIn, IsString } from 'class-validator';
import { SOCIETES, SocieteType } from '../../common/societe.constants';

export class CreateClientDto {
  @IsString()
  nomClient: string;

  @IsIn(SOCIETES)
  societe: SocieteType;
}
