import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { TourSessionModule } from '@/modules/tour-session/tour-session.module';
import { CacheModule } from '@/modules/cache/cache.module';
import { BullModule } from '@nestjs/bullmq';
import { BookingProcessor } from './processors/booking.processor';
import { MailModule } from '../mail/mail.module';
import { BookingsCronService } from './bookings.cron';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking]),
    TourSessionModule, 
    CacheModule,
    MailModule,
    BullModule.registerQueue({
      name: 'booking',
    }),
  ],
  controllers: [BookingsController],
  providers: [BookingsService, BookingProcessor, BookingsCronService],
  exports: [BookingsService], 
})
export class BookingsModule {}
