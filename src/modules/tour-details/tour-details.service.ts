import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TourDetail, ITourImage } from './entities/tour-detail.entity';
import { Tour } from '@/modules/tours/entities/tour.entity';
import { UploadService } from '../upload/upload.service';
import { CacheService } from '../cache/cache.service';
import { UpdateTourDetailDto } from './dto/update-tour-detail.dto';
import { CreateTourDetailDto } from './dto/create-tour-detail.dto';

@Injectable()
export class TourDetailsService {
  constructor(
    @InjectRepository(TourDetail)
    private readonly tourDetailRepository: Repository<TourDetail>,
    private readonly uploadService: UploadService,
    private readonly cacheService: CacheService,
    @InjectRepository(Tour)
    private readonly tourRepository: Repository<Tour>,
  ) {}

  async create(createTourDetailDto: CreateTourDetailDto): Promise<TourDetail> {
    const tour = await this.tourRepository.findOne({ where: { id: createTourDetailDto.tourId } });
    if (!tour) {
      throw new NotFoundException(`Không tìm thấy tour với ID ${createTourDetailDto.tourId}`);
    }

    const existingDetail = await this.tourDetailRepository.findOne({ where: { tourId: createTourDetailDto.tourId } });
    if (existingDetail) {
      throw new BadRequestException('Tour này đã có tour detail');
    }

    try {
      const tourDetail = this.tourDetailRepository.create(createTourDetailDto);
      const saved = await this.tourDetailRepository.save(tourDetail);
      
      await this.cacheService.del(`tours:${createTourDetailDto.tourId}`);
      await this.cacheService.incrementCacheVersion('tours');
      
      return saved;
    } catch (error) {
      throw new BadRequestException('Tạo tour detail thất bại: ' + error.message);
    }
  }

  async findAll(): Promise<TourDetail[]> {
    return await this.tourDetailRepository.find({ relations: ['tour'] });
  }

  async findOne(id: string): Promise<TourDetail> {
    const tourDetail = await this.tourDetailRepository.findOne({
      where: { id },
      relations: ['tour'],
    });
    if (!tourDetail) {
      throw new NotFoundException(`Không tìm thấy tour detail với ID ${id}`);
    }
    return tourDetail;
  }

  async findByTourId(tourId: string): Promise<TourDetail> {
    const tourDetail = await this.tourDetailRepository.findOne({
      where: { tourId },
      relations: ['tour'],
    });
    if (!tourDetail) {
      throw new NotFoundException(
        `Không tìm thấy tour detail cho tour ID ${tourId}`,
      );
    }
    return tourDetail;
  }

  async update(id: string, updateTourDetailDto: UpdateTourDetailDto) {
    const tourDetail = await this.tourDetailRepository.findOne({
      where: { id },
      relations: ['tour'],
    });

    if (!tourDetail) {
      throw new NotFoundException(`Không tìm thấy tour detail với ID ${id}`);
    }

    Object.assign(tourDetail, updateTourDetailDto);
    const updated = await this.tourDetailRepository.save(tourDetail);

    if (tourDetail.tour?.id) {
      await this.cacheService.del(`tours:${tourDetail.tour.id}`);
      await this.cacheService.incrementCacheVersion('tours');
    }

    return updated;
  }

  async uploadImages(
    tourDetailId: string,
    files: Express.Multer.File[],
  ): Promise<{ message: string; images: ITourImage[] }> {
    const tourDetail = await this.tourDetailRepository.findOne({
      where: { id: tourDetailId },
      relations: ['tour'],
    });
    if (!tourDetail) {
      throw new NotFoundException(
        `Không tìm thấy tour detail với ID ${tourDetailId}`,
      );
    }

    if (!files || files.length === 0) {
      throw new BadRequestException('Chưa có file ảnh được tải lên');
    }

    try {
      const currentImages: ITourImage[] = tourDetail.images || [];

      const uploaded = await Promise.all(
        files.map((file) =>
          this.uploadService.uploadImage(file, 'tour_details').then((result) => ({
            url: result.secure_url,
            publicId: result.public_id,
            type: result.resource_type as 'image' | 'video',
          })),
        ),
      );

      tourDetail.images = [...currentImages, ...uploaded];
      await this.tourDetailRepository.save(tourDetail);

      if (tourDetail.tour?.id) {
        await this.cacheService.del(`tours:${tourDetail.tour.id}`);
        await this.cacheService.incrementCacheVersion('tours');
      }

      return {
        message: `Đã tải lên ${uploaded.length} ảnh thành công`,
        images: tourDetail.images,
      };
    } catch (error) {
      throw new BadRequestException('Tải ảnh thất bại: ' + error.message);
    }
  }

  async uploadVideo(
    tourDetailId: string,
    file: Express.Multer.File,
  ): Promise<{ message: string; images: ITourImage[] }> {
    const tourDetail = await this.tourDetailRepository.findOne({
      where: { id: tourDetailId },
      relations: ['tour'],
    });
    if (!tourDetail) {
      throw new NotFoundException(
        `Không tìm thấy tour detail với ID ${tourDetailId}`,
      );
    }

    if (!file) {
      throw new BadRequestException('Chưa có file video được tải lên');
    }

    try {
      const currentImages: ITourImage[] = tourDetail.images || [];

      const result = await this.uploadService.uploadImage(file, 'tour_details');
      const uploadedVideo = {
        url: result.secure_url,
        publicId: result.public_id,
        type: result.resource_type as 'image' | 'video',
      };

      tourDetail.images = [...currentImages, uploadedVideo];
      await this.tourDetailRepository.save(tourDetail);

      if (tourDetail.tour?.id) {
        await this.cacheService.del(`tours:${tourDetail.tour.id}`);
        await this.cacheService.incrementCacheVersion('tours');
      }

      return {
        message: 'Đã tải lên video thành công',
        images: tourDetail.images,
      };
    } catch (error) {
      throw new BadRequestException('Tải video thất bại: ' + error.message);
    }
  }

  async deleteImage(
    tourDetailId: string,
    publicId: string,
  ): Promise<{ message: string; images: ITourImage[] }> {
    const tourDetail = await this.tourDetailRepository.findOne({
      where: { id: tourDetailId },
      relations: ['tour'],
    });
    if (!tourDetail) {
      throw new NotFoundException(
        `Không tìm thấy tour detail với ID ${tourDetailId}`,
      );
    }

    const currentImages: ITourImage[] = tourDetail.images || [];
    const imageToDelete = currentImages.find((img) => img.publicId === publicId);

    if (!imageToDelete) {
      throw new NotFoundException(
        `Không tìm thấy ảnh với publicId "${publicId}"`,
      );
    }

    try {
      await this.uploadService.deleteImage(publicId, imageToDelete.type || 'image');
    } catch {
      // Không block nếu xóa Cloudinary thất bại
    }

    const remaining = currentImages.filter((img) => img.publicId !== publicId);
    tourDetail.images = remaining;
    await this.tourDetailRepository.save(tourDetail);

    if (tourDetail.tour?.id) {
      await this.cacheService.del(`tours:${tourDetail.tour.id}`);
      await this.cacheService.incrementCacheVersion('tours');
    }

    return {
      message: 'Đã xóa ảnh thành công',
      images: tourDetail.images,
    };
  }

  async remove(id: string): Promise<void> {
    const tourDetail = await this.findOne(id);
    
    try {
      await this.tourDetailRepository.softRemove(tourDetail);
      
      if (tourDetail.tourId) {
        await this.cacheService.del(`tours:${tourDetail.tourId}`);
        await this.cacheService.incrementCacheVersion('tours');
      }
    } catch (error) {
      throw new BadRequestException('Xóa tour detail thất bại: ' + error.message);
    }
  }
}
