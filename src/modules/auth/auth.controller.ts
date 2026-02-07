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
import { GoogleOAuthGuard } from '@/guards/google-auth.guard';

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
    return this.authService.login(req.user, res);
  }

  @Get()
  @UseGuards(GoogleOAuthGuard)
  async googleAuth(@Req() req) {}

  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  async googleAuthRedirect(
    @Req() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.googleLogin(req.user, res);
  }

  @Post('verify-account')
  @Public()
  @Message('Account verified successfully.')
  verifyAccount(@Body() body: { email: string; otp: string }) {
    return this.authService.verifyAccount(body.email, body.otp);
  }

  @Get('me')
  getProfile(@Req() req: Request) {
    return req.user;
  }

  @Post('refresh-token')
  @Public()
  @Message('Token refreshed successfully.')
  @UseGuards(RefreshJwt)
  refreshToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.handleRefreshToken(req.user, res);
  }
}
