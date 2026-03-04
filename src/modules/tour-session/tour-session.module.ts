import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TourSessionService } from './tour-session.service';
import { TourSessionController } from './tour-session.controller';
import { TourSession } from './entities/tour-session.entity';
import { Tour } from '../tours/entities/tour.entity';
import { TourSessionSubscriber } from './tour-session.subscriber';

@Module({
  imports: [TypeOrmModule.forFeature([TourSession, Tour])],
  controllers: [TourSessionController],
  providers: [TourSessionService, TourSessionSubscriber],
  exports: [TourSessionService, TypeOrmModule],
})
export class TourSessionModule {}
