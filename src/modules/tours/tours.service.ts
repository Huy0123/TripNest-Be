import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, Brackets } from 'typeorm';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import { Tour } from './entities/tour.entity';
import { CacheService } from '@/modules/cache/cache.service';
import { ToursQueryDto } from './dto/tours-query.dto';
import { LocationService } from '../location/location.service';
import { TourDetail } from '../tour-details/entities/tour-detail.entity';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class ToursService {
  constructor(
    @InjectRepository(Tour)
    private readonly tourRepository: Repository<Tour>,
    private readonly cacheService: CacheService,
    private readonly locationService: LocationService,
    @InjectRepository(TourDetail)
    private readonly tourDetailRepository: Repository<TourDetail>,
    private readonly uploadService: UploadService,
  ) {}

  async create(createTourDto: CreateTourDto): Promise<Tour> {
    const departureLocation = await this.locationService.isDepartureLocationId(
      createTourDto.departureLocationId,
    );
    const destinations = await this.locationService.isDestinationLocationIds(
      createTourDto.destinationIds,
    );
    if (!departureLocation) {
      throw new NotFoundException(
        `Không tìm thấy địa điểm khởi hành với ID ${createTourDto.departureLocationId}`,
      );
    }
    if (
      !destinations ||
      destinations.length !== createTourDto.destinationIds.length
    ) {
      throw new NotFoundException(
        `Một hoặc nhiều địa điểm đến không tồn tại`,
      );
    }

    try {
      // Tạo tour
      const tour = this.tourRepository.create(createTourDto);
      tour.departureLocation = departureLocation;
      tour.destinations = destinations;
      const savedTour = await this.tourRepository.save(tour);
      await this.cacheService.incrementCacheVersion('tours');
      return savedTour;
    } catch (error) {
      throw new BadRequestException('Tạo tour thất bại: ' + error.message);
    }
  }

  async update(id: string, updateTourDto: UpdateTourDto): Promise<Tour> {
    if (updateTourDto.departureLocationId) {
      const departureLocation =
        await this.locationService.isDepartureLocationId(
          updateTourDto.departureLocationId,
        );
      if (!departureLocation) {
        throw new NotFoundException(
          `Không tìm thấy địa điểm khởi hành với ID ${updateTourDto.departureLocationId}`,
        );
      }
    }

    if (updateTourDto.destinationIds) {
      const destinations = await this.locationService.isDestinationLocationIds(
        updateTourDto.destinationIds,
      );
      if (
        !destinations ||
        destinations.length !== updateTourDto.destinationIds.length
      ) {
        throw new NotFoundException(
          `Một hoặc nhiều địa điểm đến không tồn tại`,
        );
      }
    }
    try {
      const result = await this.tourRepository.findOne({
        where: { id },
        relations: ['departureLocation', 'destinations', 'detail'],
      });
      if (!result) {
        throw new NotFoundException(`Không tìm thấy tour với ID ${id}`);
      }
      const updatedTour = this.tourRepository.merge(result, updateTourDto);

      await this.cacheService.incrementCacheVersion('tours');
      await this.cacheService.del(`tours:${id}`);
      return await this.tourRepository.save(updatedTour);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Cập nhật tour thất bại: ' + error.message);
    }
  }

  async findAll(
    query: ToursQueryDto,
  ): Promise<{ data: Tour[]; total: number; page: number; limit: number }> {
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
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      destinationSearch,
    } = query;

    const queryHash = Buffer.from(JSON.stringify(query)).toString('base64');
    const version = await this.cacheService.getCacheVersion('tours');
    const cacheKey = `tours:list:v${version}:${queryHash}`;

    const cachedData = await this.cacheService.get<{
      data: Tour[];
      total: number;
      page: number;
      limit: number;
    }>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const queryBuilder = this.tourRepository
      .createQueryBuilder('tour')
      .leftJoinAndSelect('tour.departureLocation', 'departureLocation')
      .leftJoinAndSelect('tour.destinations', 'destinations')
      .select([
        'tour.id',
        'tour.name',
        'tour.duration',
        'tour.image',
        'tour.price',
        'tour.rating',
        'tour.discount',
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
      queryBuilder.andWhere(
        'destinations.id = :destinationId OR departureLocation.id = :destinationId',
        { destinationId },
      );
    }

    if (destinationSearch) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('destinations.city ILIKE :destSearch', {
            destSearch: `%${destinationSearch}%`,
          }).orWhere('destinations.country ILIKE :destSearch', {
            destSearch: `%${destinationSearch}%`,
          });
        }),
      );
    }

    if (departureLocationId) {
      queryBuilder.andWhere('departureLocation.id = :departureLocationId', {
        departureLocationId,
      });
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

    queryBuilder.orderBy(`tour.${sortBy}`, sortOrder);
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    const result = { data, total, page, limit };

    await this.cacheService.set(cacheKey, result, 300_000); // 5 minutes
    return result;
  }

  async findByDiscount() {
    return await this.tourRepository.find({
      where: { discount: MoreThan(0) },
      order: { discount: 'DESC' },
      take: 15,
    });
  }

  async findOne(id: string): Promise<Tour> {
    const cacheKey = `tours:${id}`;
    const cachedData = await this.cacheService.get<Tour>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const tour = await this.tourRepository.findOne({
      where: { id },
      relations: ['departureLocation', 'destinations', 'detail', 'sessions'],
    });

    if (!tour) {
      throw new NotFoundException(`Không tìm thấy tour với ID ${id}`);
    }

    await this.cacheService.set(cacheKey, tour, 600_000); // 10 minutes
    return tour;
  }

  async remove(id: string): Promise<void> {
    const tour = await this.findOne(id);
    const departureLocationId = tour.departureLocation?.id;
    const destinationIds = tour.destinations?.map((d) => d.id) || [];

    try {
      await this.tourRepository.softRemove(tour);
      await this.cacheService.incrementCacheVersion('tours');
      await this.cacheService.del(`tours:${id}`);
      if (departureLocationId) {
        await this.cacheService.del(`tours:location:${departureLocationId}`);
      }
      for (const destId of destinationIds) {
        await this.cacheService.del(`tours:location:${destId}`);
      }
    } catch (error) {
      throw new BadRequestException('Xóa tour thất bại: ' + error.message);
    }
  }

  async uploadImage(id: string, file: Express.Multer.File): Promise<{ message: string; image: string }> {
    const tour = await this.tourRepository.findOne({ where: { id } });
    if (!tour) {
      throw new NotFoundException(`Không tìm thấy tour với ID ${id}`);
    }

    if (!file) {
      throw new BadRequestException('Chưa có file ảnh được tải lên');
    }

    try {
      if (tour.imagePublicId) {
        try {
          await this.uploadService.deleteImage(tour.imagePublicId, (tour.imageType as any) || 'image');
        } catch {
        }
      }

      const uploadedImage = await this.uploadService.uploadImage(file, 'tours');
      tour.image = uploadedImage.secure_url;
      tour.imagePublicId = uploadedImage.public_id;
      tour.imageType = uploadedImage.resource_type as 'image' | 'video';

      await this.tourRepository.save(tour);
      await this.cacheService.incrementCacheVersion('tours');
      await this.cacheService.del(`tours:${id}`);

      return {
        message: `${tour.imageType === 'video' ? 'Video' : 'Ảnh'} đã được tải lên thành công`,
        image: tour.image,
      };
    } catch (error) {
      throw new BadRequestException('Tải ảnh thất bại: ' + error.message);
    }
  }
}
