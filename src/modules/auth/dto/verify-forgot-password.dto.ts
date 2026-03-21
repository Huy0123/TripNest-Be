import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyForgotPasswordDto {
  @IsNotEmpty()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: 'OTP phải có 6 ký tự' })
  otp: string;
}
