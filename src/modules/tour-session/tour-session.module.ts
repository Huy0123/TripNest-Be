import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TourSessionService } from './tour-session.service';
import { TourSessionController } from './tour-session.controller';
import { TourSession } from './entities/tour-session.entity';
import { Tour } from '../tours/entities/tour.entity';
import { TourSessionSubscriber } from './tour-session.subscriber';
import { TourSessionTask } from './tour-session.task';

@Module({
  imports: [TypeOrmModule.forFeature([TourSession, Tour])],
  controllers: [TourSessionController],
  providers: [TourSessionService, TourSessionSubscriber, TourSessionTask],
  exports: [TourSessionService, TypeOrmModule, TourSessionTask],
})
export class TourSessionModule {}
