import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import { Tour } from './entities/tour.entity';
import { Location } from '../location/entities/location.entity';
import { CacheService } from '@/modules/cache/cache.service';
import { ToursQueryDto } from './dto/tours-query.dto';

@Injectable()
export class ToursService {
  constructor(
    @InjectRepository(Tour)
    private readonly tourRepository: Repository<Tour>,
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
    private readonly cacheService: CacheService,
  ) {}

  async create(createTourDto: CreateTourDto): Promise<Tour> {
    const tour = this.tourRepository.create(createTourDto);

    // Xử lý departureLocation
    if (createTourDto.departureLocationId) {
      const departureLocation = await this.locationRepository.findOne({
        where: { id: createTourDto.departureLocationId },
      });
      if (!departureLocation) {
        throw new NotFoundException(
          `Departure location with ID ${createTourDto.departureLocationId} not found`,
        );
      }
      tour.departureLocation = departureLocation;
    }

    // Xử lý destinations
    if (createTourDto.destinationIds && createTourDto.destinationIds.length > 0) {
      const destinations = await this.locationRepository.find({
        where: { id: In(createTourDto.destinationIds) },
      });
      if (destinations.length !== createTourDto.destinationIds.length) {
        throw new NotFoundException(`One or more destination locations not found`);
      }
      tour.destinations = destinations;
    }

    try {
      const savedTour = await this.tourRepository.save(tour);
      await this.cacheService.del(`tours:list:*`);
      if (savedTour.departureLocation) {
          await this.cacheService.del(`tours:location:${savedTour.departureLocation.id}`);
      }
      if (savedTour.destinations) {
        for (const dest of savedTour.destinations) {
          await this.cacheService.del(`tours:location:${dest.id}`);
        }
      }
      return savedTour;
    } catch (error) {
      throw new BadRequestException('Failed to create tour: ' + error.message);
    }
  }

  async findAll(query: ToursQueryDto ): Promise<{ data: Tour[]; total: number; page: number; limit: number }> {
    const {
      page = 1,
      limit = 10,
      minPrice,
      maxPrice,
      destinationId,
      departureLocationId,
      rating,
      duration,
      stayOption,
      date,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      isPopular,
    } = query;

    // Cache key
    const queryHash = Buffer.from(JSON.stringify(query)).toString('base64');
    const cacheKey = `tours:list:${queryHash}`;

    const cachedData = await this.cacheService.get<{ data: Tour[]; total: number; page: number; limit: number }>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const queryBuilder = this.tourRepository.createQueryBuilder('tour')
      .leftJoinAndSelect('tour.departureLocation', 'departureLocation')
      .leftJoinAndSelect('tour.destinations', 'destinations')
      .select([
        'tour.id',
        'tour.name',
        'tour.duration',
        'tour.image',
        'tour.price',
        'tour.rating',
        'tour.reviewCount',
        'tour.guideService',
        'tour.createdAt',
        'departureLocation.id',
        'departureLocation.city',
        'departureLocation.country',
        'destinations.id',
        'destinations.city',
        'destinations.country',
      ]);

    if (minPrice) {
      queryBuilder.andWhere('tour.price >= :minPrice', { minPrice });
    }

    if (maxPrice) {
      queryBuilder.andWhere('tour.price <= :maxPrice', { maxPrice });
    }

    if (destinationId) {
      queryBuilder.andWhere('destinations.id = :destinationId OR departureLocation.id = :destinationId', { destinationId });
    }

    if (departureLocationId) {
      queryBuilder.andWhere('departureLocation.id = :departureLocationId', { departureLocationId });
    }

    if (rating) {
      queryBuilder.andWhere('tour.rating >= :rating', { rating });
    }

    if (duration) {
      queryBuilder.andWhere('tour.duration <= :duration', { duration });
    }

    if (stayOption) {
      queryBuilder.andWhere('tour.stayOption = :stayOption', { stayOption });
    }

    if (date) {
      queryBuilder.andWhere('tour.date = :date', { date });
    }

    if (isPopular !== undefined) {
      queryBuilder.andWhere('tour.isPopular = :isPopular', { isPopular });
    }

    queryBuilder.orderBy(`tour.${sortBy}`, sortOrder as 'ASC' | 'DESC');
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    const result = { data, total, page, limit };

    await this.cacheService.set(cacheKey, result, 300_000); // 5 minutes
    return result;
  }

  async findOne(id: string): Promise<Tour> {
    const cacheKey = `tours:${id}`;
    const cachedData = await this.cacheService.get<Tour>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Load all relations for detail page
    const tour = await this.tourRepository.findOne({
      where: { id },
      relations: [
        'departureLocation',
        'destinations',
        'detail',
      ],
    });

    if (!tour) {
      throw new NotFoundException(`Tour with ID ${id} not found`);
    }

    await this.cacheService.set(cacheKey, tour, 600_000); // 10 minutes
    return tour;
  }

  async update(id: string, updateTourDto: UpdateTourDto): Promise<Tour> {
    const tour = await this.findOne(id);

    if (updateTourDto.departureLocationId) {
      const departureLocation = await this.locationRepository.findOne({
        where: { id: updateTourDto.departureLocationId },
      });
      if (!departureLocation) {
        throw new NotFoundException(
          `Departure location with ID ${updateTourDto.departureLocationId} not found`,
        );
      }
      tour.departureLocation = departureLocation;
    }

    if (updateTourDto.destinationIds) {
      const destinations = await this.locationRepository.find({
        where: { id: In(updateTourDto.destinationIds) },
      });
      if (destinations.length !== updateTourDto.destinationIds.length) {
        throw new NotFoundException(`One or more destination locations not found`);
      }
      tour.destinations = destinations;
    }

    Object.assign(tour, updateTourDto);

    try {
      const savedTour = await this.tourRepository.save(tour);
      await this.cacheService.del(`tours:list:*`);
      await this.cacheService.del(`tours:${id}`);
      if (savedTour.departureLocation) {
          await this.cacheService.del(`tours:location:${savedTour.departureLocation.id}`);
      }
      if (savedTour.destinations) {
        for (const dest of savedTour.destinations) {
          await this.cacheService.del(`tours:location:${dest.id}`);
        }
      }
      return savedTour;
    } catch (error) {
      throw new BadRequestException('Failed to update tour: ' + error.message);
    }
  }

  async remove(id: string): Promise<void> {
    const tour = await this.findOne(id);
    const departureLocationId = tour.departureLocation?.id;
    const destinationIds = tour.destinations?.map(d => d.id) || [];

    try {
      await this.tourRepository.softRemove(tour);
      await this.cacheService.del(`tours:list:*`);
      await this.cacheService.del(`tours:${id}`);
      if (departureLocationId) {
          await this.cacheService.del(`tours:location:${departureLocationId}`);
      }
      for (const destId of destinationIds) {
          await this.cacheService.del(`tours:location:${destId}`);
      }
    } catch (error) {
      throw new BadRequestException('Failed to delete tour: ' + error.message);
    }
  }

}
