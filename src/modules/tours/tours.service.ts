import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import { Tour } from './entities/tour.entity';
import { Location } from '../location/entities/location.entity';
import { CacheService } from '@/modules/cache/cache.service';

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

    // Nếu có locationId, tìm và gán location
    if (createTourDto.locationId) {
      const location = await this.locationRepository.findOne({
        where: { id: createTourDto.locationId },
      });
      if (!location) {
        throw new NotFoundException(
          `Location with ID ${createTourDto.locationId} not found`,
        );
      }
      tour.location = location;
    }

    try {
      const savedTour = await this.tourRepository.save(tour);
      // Invalidate cache
      await this.invalidateCache();
      if (savedTour.location) {
          await this.cacheService.del(`tours:location:${savedTour.location.id}`);
      }
      return savedTour;
    } catch (error) {
      throw new BadRequestException('Failed to create tour: ' + error.message);
    }
  }

  async findAll(query: any): Promise<{ data: Tour[]; total: number; page: number; limit: number }> {
    const {
      page = 1,
      limit = 10,
      search,
      minPrice,
      maxPrice,
      destinationId,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    // Version-based cache key
    const version = await this.cacheService.get<number>('tours:version') || 0;
    const queryHash = Buffer.from(JSON.stringify(query)).toString('base64');
    const cacheKey = `tours:list:v${version}:${queryHash}`;

    const cachedData = await this.cacheService.get<{ data: Tour[]; total: number; page: number; limit: number }>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Optimize: Only load necessary fields and relations
    const queryBuilder = this.tourRepository.createQueryBuilder('tour')
      .leftJoinAndSelect('tour.location', 'location')
      .leftJoinAndSelect('tour.images', 'images')
      .select([
        'tour.id',
        'tour.name',
        'tour.duration',
        'tour.type',
        'tour.image',
        'tour.price',
        'tour.discount',
        'tour.rating',
        'tour.reviewCount',
        'tour.guideService',
        'tour.createdAt',
        'location.id',
        'location.name',
        'location.country',
        'images.id',
        'images.url',
        'images.isMain',
      ]);

    if (search) {
      queryBuilder.andWhere('(tour.name ILIKE :search)', { search: `%${search}%` });
    }

    if (minPrice) {
      queryBuilder.andWhere('tour.price >= :minPrice', { minPrice });
    }

    if (maxPrice) {
      queryBuilder.andWhere('tour.price <= :maxPrice', { maxPrice });
    }

    if (destinationId) {
      queryBuilder.andWhere('location.id = :destinationId', { destinationId });
    }

    queryBuilder.orderBy(`tour.${sortBy}`, sortOrder as 'ASC' | 'DESC');
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    const result = { data, total, page, limit };

    await this.cacheService.set(cacheKey, result, 86400000); // 24 hours
    return result;
  }

  async invalidateCache() {
    const currentVersion = await this.cacheService.get<number>('tours:version') || 0;
    await this.cacheService.set('tours:version', currentVersion + 1, 0);
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
        'location',
        'images',
        'detail',
        'sessions',
        'reviews',
        'reviews.user',
      ],
    });

    if (!tour) {
      throw new NotFoundException(`Tour with ID ${id} not found`);
    }

    await this.cacheService.set(cacheKey, tour, 3600000); // 1 hour
    return tour;
  }

  async update(id: string, updateTourDto: UpdateTourDto): Promise<Tour> {
    const tour = await this.findOne(id);

    // Cập nhật location nếu có
    if (updateTourDto.locationId) {
      const location = await this.locationRepository.findOne({
        where: { id: updateTourDto.locationId },
      });
      if (!location) {
        throw new NotFoundException(
          `Location with ID ${updateTourDto.locationId} not found`,
        );
      }
      tour.location = location;
    }

    // Cập nhật transportation nếu có
    // if (updateTourDto.transportationId) {
    //   const transportation = await this.transportationRepository.findOne({
    //     where: { id: updateTourDto.transportationId },
    //   });
    //   if (!transportation) {
    //     throw new NotFoundException(
    //       `Transportation with ID ${updateTourDto.transportationId} not found`,
    //     );
    //   }
    //   tour.transportation = transportation;
    // }

    // Merge các thuộc tính khác
    Object.assign(tour, updateTourDto);

    try {
      const savedTour = await this.tourRepository.save(tour);
      // Invalidate cache
      await this.invalidateCache();
      await this.cacheService.del(`tours:${id}`);
      if (savedTour.location) {
          await this.cacheService.del(`tours:location:${savedTour.location.id}`);
      }
      return savedTour;
    } catch (error) {
      throw new BadRequestException('Failed to update tour: ' + error.message);
    }
  }

  async remove(id: string): Promise<void> {
    const tour = await this.findOne(id);
    const locationId = tour.location?.id;

    try {
      await this.tourRepository.softRemove(tour);
      // Invalidate cache
      await this.invalidateCache();
      await this.cacheService.del(`tours:${id}`);
       if (locationId) {
          await this.cacheService.del(`tours:location:${locationId}`);
      }
    } catch (error) {
      throw new BadRequestException('Failed to delete tour: ' + error.message);
    }
  }

  async findByLocation(locationId: string): Promise<Tour[]> {
    const cacheKey = `tours:location:${locationId}`;
    const cachedData = await this.cacheService.get<Tour[]>(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const tours = await this.tourRepository.find({
      where: { location: { id: locationId } },
      relations: ['location', 'images'],
      select: {
        id: true,
        name: true,
        duration: true,
        type: true,
        image: true,
        price: true,
        discount: true,
        rating: true,
        reviewCount: true,
      },
    });

    await this.cacheService.set(cacheKey, tours, 3600000); // 1 hour
    return tours;
  }

  async search(keyword: string): Promise<Tour[]> {
    return await this.tourRepository
      .createQueryBuilder('tour')
      .leftJoinAndSelect('tour.location', 'location')
      .leftJoinAndSelect('tour.images', 'images')
      .select([
        'tour.id',
        'tour.name',
        'tour.duration',
        'tour.type',
        'tour.price',
        'tour.rating',
        'location.id',
        'location.name',
        'images.id',
        'images.url',
        'images.isMain',
      ])
      .where('tour.name ILIKE :keyword', {
        keyword: `%${keyword}%`,
      })
      .orderBy('tour.createdAt', 'DESC')
      .getMany();
  }
}
