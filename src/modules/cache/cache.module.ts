import { Module } from '@nestjs/common';
import { CacheService } from './cache.service';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import KeyvRedis from '@keyv/redis';
import { NAME_REGISTER } from '@/enums/name-register.enum';
import { BullModule } from '@nestjs/bullmq';
@Module({
  imports: [
    NestCacheModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          store: new KeyvRedis(
            `redis://${configService.get('REDIS_HOST')}:${configService.get('REDIS_PORT')}`,
          ),
        };
      },
    }),
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
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
