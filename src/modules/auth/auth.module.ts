import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from '../../strategy/local.strategy';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from '../../strategy/jwt.strategy';
import { OtpService } from './otp.service';
import { BullModule } from '@nestjs/bullmq';
import { NAME_REGISTER } from '@/enums/name-register.enum';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [
    UsersModule,
    CacheModule,
    PassportModule,
    BullModule.registerQueue({
      name: NAME_REGISTER.OTP,
    }),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'fallback-secret'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '3600s'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, OtpService, LocalStrategy, JwtStrategy],
  exports: [AuthService, OtpService],
})
export class AuthModule {}
