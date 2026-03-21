import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { AuthProvider } from '@/enums/auth.enum';
import { ErrorMessages } from '@/constants/error-messages.constant';
import ms = require('ms');

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);
  private googleClient: OAuth2Client;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
    );
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email, true);
    if (!user) {
      return null;
    }

    if (!user.password || !user.providers?.includes(AuthProvider.LOCAL)) {
      throw new HttpException(
        ErrorMessages.AUTH.GOOGLE_ACCOUNT,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any, res: Response, rememberMe: boolean = false) {
    try {
      return this.createTokensAndResponse(user, res, rememberMe);
    } catch (error) {
      this.logger.error('Lỗi khi đăng nhập', error.stack);
      throw new HttpException(
        ErrorMessages.AUTH.INVALID_CREDENTIALS,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async logout(userId: string, res: Response) {
    await this.usersService.updateHashedRefreshToken(userId, null);
    const cookieOptions = this.buildCookieOptions();
    res.clearCookie('refreshToken', cookieOptions);
    res.clearCookie('accessToken', cookieOptions);
  }

  async googleLogin(idToken: string, res: Response) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      });

      const payload = ticket.getPayload();

      if (!payload) {
        throw new HttpException(
          ErrorMessages.AUTH.GOOGLE_FAILED,
          HttpStatus.UNAUTHORIZED,
        );
      }

      const { email, given_name, family_name, picture, sub } = payload;

      const existingUser = await this.usersService.createOrUpdateGoogleUser({
        email: email as string,
        firstName: given_name || '',
        lastName: family_name || '',
        picture: picture || '',
        googleId: sub,
      });

      return this.createTokensAndResponse(existingUser, res, true);
    } catch (error) {
      this.logger.error('Lỗi khi đăng nhập Google', error.stack);
      throw new HttpException(
        ErrorMessages.AUTH.GOOGLE_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async register(user: RegisterDto) {
    return await this.usersService.register(user);
  }

  async verifyAccount(email: string, otp: string) {
    return await this.usersService.verifyAccount(email, otp);
  }

  async resendVerificationEmail(email: string) {
    return await this.usersService.sendVerificationAccount(email);
  }

  async forgotPassword(email: string) {
    return await this.usersService.sendForgotPasswordOtp(email);
  }

  async verifyForgotPasswordOtp(email: string, otp: string) {
    return await this.usersService.verifyForgotPasswordOtp(email, otp);
  }

  async resetPassword(
    email: string,
    otp: string,
    newPassword: string,
    confirmNewPassword: string,
  ) {
    if (newPassword !== confirmNewPassword) {
      throw new HttpException(
        ErrorMessages.AUTH.PASSWORD_MISMATCH,
        HttpStatus.BAD_REQUEST,
      );
    }
    return await this.usersService.resetPassword(email, otp, newPassword);
  }

  async findUserById(id: string, withRefreshToken = false) {
    return await this.usersService.findUserById(id, withRefreshToken);
  }

  async handleRefreshToken(user: any, res: Response) {
    try {
      return await this.createTokensAndResponse(user, res, true); 
    } catch (error) {
      this.logger.error('Lỗi khi làm mới token', error.stack);
      throw new HttpException(
        ErrorMessages.AUTH.TOKEN_REFRESH_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private buildJwtPayload(user: any) {
    return {
      email: user.email,
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      phone: user.phone,
      role: user.role,
    };
  }

  private buildCookieOptions(maxAge?: number): Record<string, any> {
    const isProd = this.configService.get('NODE_ENV') === 'production';
    const options: Record<string, any> = {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
    };
    if (maxAge) options.maxAge = maxAge;
    return options;
  }

  private genRefreshToken(payload: any) {
    return this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
    });
  }

  private async createTokensAndResponse(
    user: any,
    res: Response,
    rememberMe: boolean = false,
  ) {
    const payload = this.buildJwtPayload(user);

    if (!user.isActive) {
      await this.usersService.sendVerificationAccount(user.email);
      throw new HttpException(
        { message: ErrorMessages.AUTH.ACCOUNT_INACTIVE, email: user.email },
        HttpStatus.FORBIDDEN,
      );
    }

    const refreshToken = this.genRefreshToken(payload);
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.usersService.updateHashedRefreshToken(
      user.id,
      hashedRefreshToken,
    );

    const expiredTime = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
    );
    const maxAge: number | undefined = rememberMe
      ? ms(expiredTime as ms.StringValue) || 15 * 60 * 1000
      : undefined;

    const cookieOptions = this.buildCookieOptions(maxAge);

    res.cookie('refreshToken', refreshToken, cookieOptions);

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN'),
    });
    res.cookie('accessToken', accessToken, cookieOptions);

    return { user: { ...payload, providers: user.providers } };
  }
}
