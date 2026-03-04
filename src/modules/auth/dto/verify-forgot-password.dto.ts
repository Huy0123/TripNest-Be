import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyForgotPasswordDto {
  @IsNotEmpty()
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsNotEmpty()
  @IsString()
  @Length(8, 8, { message: 'OTP must be exactly 8 characters' })
  otp: string;
}
