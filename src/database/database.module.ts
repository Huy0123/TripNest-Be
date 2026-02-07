import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseSeederService } from './database-seeder.service';
import { Location } from '@/modules/location/entities/location.entity';
import { User } from '@/modules/users/entities/user.entity';
import { UserProfile } from '@/modules/user_profiles/entities/user_profile.entity';
import { Tour } from '@/modules/tours/entities/tour.entity';
import { TourDetail } from '@/modules/tour-details/entities/tour-detail.entity';
import { TourImage } from '@/modules/tour-images/entities/tour-image.entity';
import { TourSession } from '@/modules/tour-session/entities/tour-session.entity';
import { Booking } from '@/modules/bookings/entities/booking.entity';
import { Review } from '@/modules/reviews/entities/review.entity';
import { ChatSession } from '@/modules/chat/entities/chat-session.entity';
import { ChatMessage } from '@/modules/chat/entities/chat-message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Location,
      User,
      UserProfile,
      Tour,
      TourDetail,
      TourImage,
      TourSession,
      Booking,
      Review,
      ChatSession,
      ChatMessage,
    ]),
  ],
  providers: [DatabaseSeederService],
  exports: [DatabaseSeederService],
})
export class DatabaseModule {}
