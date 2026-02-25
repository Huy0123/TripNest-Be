import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './modules/auth/auth.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { UsersModule } from './modules/users/users.module';
import { LocationModule } from './modules/location/location.module';
import { ToursModule } from './modules/tours/tours.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { MailModule } from './modules/mail/mail.module';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { RolesGuard } from './guards/role.guard';
import { CacheModule } from '@/modules/cache/cache.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ChatModule } from './modules/chat/chat.module';
import { DatabaseModule } from './database/database.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('HOST'),
        port: +configService.get('PORT_DB'),
        username: configService.get('POSTGRES_USER'),
        password: configService.get('POSTGRES_PASSWORD'),
        database: configService.get('POSTGRES_DB'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
          reconnectOnError: () => true,
          retryStrategy: (times) => {
            if (times < 4) {
              return Math.min(times * 50, 200);
            }
            return 200;
          },
        },
        defaultJobOptions: {
          removeOnComplete: 1000,
          removeOnFail: 500,
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
        },
      }),
      inject: [ConfigService],
    }),

    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    ProfilesModule,
    LocationModule,
    ToursModule,
    BookingsModule,
    ReviewsModule,
    PaymentsModule,
    MailModule,
    CacheModule,
    NotificationsModule,
    ChatModule,
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
