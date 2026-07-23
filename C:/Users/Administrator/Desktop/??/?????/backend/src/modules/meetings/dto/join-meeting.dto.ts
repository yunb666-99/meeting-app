import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class JoinMeetingDto {
  @IsNotEmpty()
  @IsString()
  meetingId: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  nickname: string;
}
