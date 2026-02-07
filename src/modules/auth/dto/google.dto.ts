import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class GoogleDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'John' })
  firstName: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'google-id-123456' })
  googleId: string;

  @IsString()
  @ApiProperty({ example: 'https://example.com/profile.jpg', required: false })
  picture?: string;
}
