import { IsIn, IsOptional, IsString } from 'class-validator';
import { SOCIETES, SocieteType } from '../../common/societe.constants';

export class UpdateClientDto {
  @IsOptional()
  @IsString()
  nomClient?: string;

  @IsOptional()
  @IsIn(SOCIETES)
  societe?: SocieteType;
}
