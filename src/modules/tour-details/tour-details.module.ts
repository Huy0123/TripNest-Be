import { Module } from '@nestjs/common';
import { TourDetailsService } from './tour-details.service';
import { TourDetailsController } from './tour-details.controller';

@Module({
  controllers: [TourDetailsController],
  providers: [TourDetailsService],
})
export class TourDetailsModule {}
