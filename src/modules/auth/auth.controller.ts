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
  @Message('Logout successful.')
  logout(@Res({ passthrough: true }) res: Response) {
    return this.authService.logout(res);
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
  resendVerificationEmail(@Body() body: { email: string }) {
    return this.authService.resendVerificationEmail(body.email);
  }

  @Get('me')
  getProfile(@Req() req: Request) {
    return req.user;
  }

  @Post('refresh-token')
  @Public()
  @Message('Token refreshed successfully.')
  @UseGuards(RefreshJwt)
  refreshToken(@Req() req: Request) {
    return this.authService.handleRefreshToken(req.user);
  }
}
