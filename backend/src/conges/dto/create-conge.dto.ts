import { ArrayMinSize, IsArray, IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateCongeDto {
  @IsInt()
  employeId: number;

  @IsArray()
  @ArrayMinSize(1)
  @IsDateString({}, { each: true })
  dates: string[];

  @IsOptional()
  @IsString()
  typeJour?: string; // 'JOURNEE' | 'MATIN' | 'APRES_MIDI'

  @IsOptional()
  @IsString()
  motif?: string;
}
