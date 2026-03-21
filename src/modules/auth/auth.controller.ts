import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyForgotPasswordDto } from './dto/verify-forgot-password.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { VerifyAccountDto } from './dto/verify-account.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { Public } from '@/decorators/public.decorator';
import { Message } from '@/decorators/message.decorator';
import { Response, Request } from 'express';
import { LocalAuthGuard } from '@/guards/local-auth.guard';
import { RefreshJwt } from '@/guards/refresh-jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @Message('Đăng ký tài khoản thành công')
  create(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @Public()
  @UseGuards(LocalAuthGuard)
  @Message('Đăng nhập thành công')
  login(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rememberMe = (req.body as any).rememberMe === true;
    return this.authService.login(req.user, res, rememberMe);
  }

  @Post('logout')
  @UseGuards(RefreshJwt)
  @Message('Đăng xuất thành công')
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const userId = (req.user as any)?.id;
    return this.authService.logout(userId, res);
  }

  @Post('google')
  @Public()
  @Message('Đăng nhập Google thành công')
  async googleAuth(
    @Body() body: GoogleAuthDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.googleLogin(body.idToken, res);
  }

  @Post('verify-account')
  @Public()
  @Message('Xác thực tài khoản thành công')
  verifyAccount(@Body() body: VerifyAccountDto) {
    return this.authService.verifyAccount(body.email, body.otp);
  }

  @Post('resend-verification')
  @Public()
  @Message('Đã gửi lại email xác thực')
  resendVerificationEmail(@Body() body: ResendVerificationDto) {
    return this.authService.resendVerificationEmail(body.email);
  }

  @Post('forgot-password')
  @Public()
  @Message('Đã gửi OTP về email')
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('verify-forgot-password')
  @Public()
  @Message('Xác minh OTP thành công')
  verifyForgotPassword(@Body() verifyDto: VerifyForgotPasswordDto) {
    return this.authService.verifyForgotPasswordOtp(
      verifyDto.email,
      verifyDto.otp,
    );
  }

  @Post('reset-password')
  @Public()
  @Message('Đặt lại mật khẩu thành công')
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.email,
      resetPasswordDto.otp,
      resetPasswordDto.newPassword,
      resetPasswordDto.confirmNewPassword,
    );
  }

  @Post('refresh')
  @Public()
  @UseGuards(RefreshJwt)
  @Message('Làm mới phiên đăng nhập thành công')
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return await this.authService.handleRefreshToken(req.user, res);
  }
}
