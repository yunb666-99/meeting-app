import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: '用户账号' })
  @IsString()
  @IsNotEmpty()
  account: string;

  @ApiProperty({ description: '用户密码' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
