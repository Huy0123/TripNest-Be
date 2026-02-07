import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ToursService } from './tours.service';
import { ToursController } from './tours.controller';
import { Tour } from './entities/tour.entity';
import { Location } from '../location/entities/location.entity';
import { CacheModule } from '@/modules/cache/cache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tour, Location]),
    CacheModule,
  ],
  controllers: [ToursController],
  providers: [ToursService],
  exports: [ToursService, TypeOrmModule],
})
export class ToursModule {}
