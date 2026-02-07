import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class RegisterDto {
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
  @ApiProperty({ example: 'password123' })
  password: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'password123' })
  confirmPassword: string;
}
