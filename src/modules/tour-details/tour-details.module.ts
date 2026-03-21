import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TourDetail } from './entities/tour-detail.entity';
import { TourDetailsService } from './tour-details.service';
import { TourDetailsController } from './tour-details.controller';
import { UploadModule } from '../upload/upload.module';
import { CacheModule } from '../cache/cache.module';
import { Tour } from '../tours/entities/tour.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TourDetail, Tour]), UploadModule, CacheModule],
  controllers: [TourDetailsController],
  providers: [TourDetailsService],
  exports: [TourDetailsService, TypeOrmModule],
})
export class TourDetailsModule {}
