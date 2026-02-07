import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TourSessionService } from './tour-session.service';
import { TourSessionController } from './tour-session.controller';
import { TourSession } from './entities/tour-session.entity';
import { Tour } from '../tours/entities/tour.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TourSession, Tour])],
  controllers: [TourSessionController],
  providers: [TourSessionService],
  exports: [TourSessionService, TypeOrmModule],
})
export class TourSessionModule {}
