import { IsNotEmpty, IsString } from 'class-validator';

export class KickParticipantDto {
  @IsNotEmpty()
  @IsString()
  identity: string;
}
