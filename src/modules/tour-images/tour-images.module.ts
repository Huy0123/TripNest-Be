import { Module } from '@nestjs/common';
import { TourImagesService } from './tour-images.service';
import { TourImagesController } from './tour-images.controller';

@Module({
  controllers: [TourImagesController],
  providers: [TourImagesService],
})
export class TourImagesModule {}
