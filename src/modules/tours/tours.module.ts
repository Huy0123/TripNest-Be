import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ToursService } from './tours.service';
import { ToursController } from './tours.controller';
import { Tour } from './entities/tour.entity';
import { CacheModule } from '@/modules/cache/cache.module';
import { TourDetail } from '../tour-details/entities/tour-detail.entity';
import { LocationModule } from '../location/location.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tour, TourDetail]),
    CacheModule,
    LocationModule,
    UploadModule,
  ],
  controllers: [ToursController],
  providers: [ToursService],
  exports: [ToursService, TypeOrmModule],
})
export class ToursModule {}
