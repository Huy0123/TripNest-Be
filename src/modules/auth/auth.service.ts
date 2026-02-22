import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import ms = require('ms');
@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email, true);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any, res: Response) {
    try {
      return this.createTokensAndResponse(user, res);
    } catch (error) {
      this.logger.error('Error during login', error.stack);
      throw new HttpException(
        'Could not log in',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async googleLogin(user: any, res: Response) {
    try {
      const { email, firstName, lastName, picture, id: googleId } = user;

      // Tạo hoặc update user với Google provider
      const existingUser = await this.usersService.createOrUpdateGoogleUser({
        email,
        firstName,
        lastName,
        picture,
        googleId,
      });

      return this.createTokensAndResponse(existingUser, res);
    } catch (error) {
      this.logger.error('Error during Google login', error.stack);
      throw new HttpException(
        'Could not log in with Google',
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

  async findUserById(id: string) {
    return await this.usersService.findUserById(id);
  }

  handleRefreshToken(user: any, res: Response) {
    try {
      const payload = {
        email: user.email,
        sub: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      };
      const refreshToken = this.genRefreshToken(payload);
      const expiredTime = this.configService.get<string>(
        'JWT_REFRESH_EXPIRES_IN',
      );
      const maxAge: number =
        ms(expiredTime as ms.StringValue) || 15 * 60 * 1000;
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        maxAge: maxAge,
      });
      const accessToken = this.jwtService.sign(payload, {
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') || '15m',
      });

      return {
        access_token: accessToken,
        user: {
          email: user.email,
        },
      };
    } catch (error) {
      this.logger.error('Error refreshing token', error.stack);
      throw new HttpException(
        'Could not refresh token',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private genRefreshToken(payload: any) {
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
    });
    return refreshToken;
  }

  private async createTokensAndResponse(user: any, res: Response) {
    const payload = {
      email: user.email,
      sub: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };

    // Kiểm tra active (chỉ cho local user chưa verify)
    if (!user.isActive) {
      await this.usersService.sendVerificationAccount(user.email);
      return {
        success: false,
        message: 'User account is not active. Verification email sent.',
      };
    }

    const refreshToken = this.genRefreshToken(payload);
    const expiredTime = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
    );
    const maxAge: number = ms(expiredTime as ms.StringValue) || 15 * 60 * 1000;

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      maxAge: maxAge,
    });

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN'),
    });

    return {
      success: true,
      message: 'Login successful',
      user: {
        ...payload,
        providers: user.providers, // Trả về danh sách providers
      },
      accessToken,
    };
  }
}
