import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TourDetail } from './entities/tour-detail.entity';
import { TourDetailsService } from './tour-details.service';
import { TourDetailsController } from './tour-details.controller';
import { UploadModule } from '../upload/upload.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [TypeOrmModule.forFeature([TourDetail]), UploadModule, CacheModule],
  controllers: [TourDetailsController],
  providers: [TourDetailsService],
  exports: [TourDetailsService, TypeOrmModule],
})
export class TourDetailsModule {}
