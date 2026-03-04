import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';
import { NAME_REGISTER } from '@/enums/name-register.enum';
import { BullModule } from '@nestjs/bullmq';
import Redis from 'ioredis';

@Module({
  imports: [
    BullModule.registerQueue(
      {
        name: NAME_REGISTER.OTP,
      },
      {
        name: NAME_REGISTER.MAIL_NOTIFICATION,
      },
      {
        name: NAME_REGISTER.PAYMENT,
      },
    ),
  ],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return new Redis({
          host: configService.get('REDIS_HOST') || 'localhost',
          port: parseInt(configService.get('REDIS_PORT') || '6379', 10),
        });
      },
    },
    CacheService,
  ],
  exports: ['REDIS_CLIENT', CacheService],
})
export class CacheModule {}
