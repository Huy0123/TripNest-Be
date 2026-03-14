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
  @Message('Registration successful.')
  create(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @Public()
  @UseGuards(LocalAuthGuard)
  @Message('Login successful.')
  login(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rememberMe = req.body.rememberMe === true;
    return this.authService.login(req.user, res, rememberMe);
  }

  @Post('logout')
  @UseGuards(RefreshJwt)
  @Message('Logout successful.')
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const userId = (req.user as any)?.id;
    return this.authService.logout(userId, res);
  }

  @Post('google')
  @Public()
  @Message('Google login successful.')
  async googleAuth(
    @Body() body: { idToken: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.googleLogin(body.idToken, res);
  }

  @Post('verify-account')
  @Public()
  @Message('Account verified successfully.')
  verifyAccount(@Body() body: { email: string; otp: string }) {
    return this.authService.verifyAccount(body.email, body.otp);
  }

  @Post('resend-verification-email')
  @Public()
  @Message('Verification email resent successfully.')
  resendVerificationEmail(@Body('email') email: string) {
    return this.authService.resendVerificationEmail(email);
  }

  @Post('forgot-password')
  @Public()
  @Message('Forgot password OTP sent successfully.')
  forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Post('verify-forgot-password')
  @Public()
  @Message('OTP verified successfully.')
  verifyForgotPassword(@Body() verifyDto: VerifyForgotPasswordDto) {
    return this.authService.verifyForgotPasswordOtp(verifyDto.email, verifyDto.otp);
  }

  @Post('reset-password')
  @Public()
  @Message('Password reset successfully.')
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
  @Message('Token refreshed successfully.')
  @UseGuards(RefreshJwt)
  refreshToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.handleRefreshToken(req.user, res);
  }
}
