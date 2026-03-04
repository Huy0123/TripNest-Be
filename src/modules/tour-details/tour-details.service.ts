import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TourDetail, ITourImage } from './entities/tour-detail.entity';
import { UploadService } from '../upload/upload.service';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class TourDetailsService {
  constructor(
    @InjectRepository(TourDetail)
    private readonly tourDetailRepository: Repository<TourDetail>,
    private readonly uploadService: UploadService,
    private readonly cacheService: CacheService,
  ) {}

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
        `TourDetail with ID ${tourDetailId} not found`,
      );
    }

    try {
      const currentImages: ITourImage[] = tourDetail.images || [];

      const uploaded = await Promise.all(
        files.map((file) =>
          this.uploadService
            .uploadImage(file, 'tour_details')
            .then((result) => ({
              url: result.secure_url,
              publicId: result.public_id,
            })),
        ),
      );

      tourDetail.images = [...currentImages, ...uploaded];
      await this.tourDetailRepository.save(tourDetail);

      // Xóa cache của tour để GET trả về dữ liệu mới
      if (tourDetail.tour?.id) {
        await this.cacheService.del(`tours:${tourDetail.tour.id}`);
        await this.cacheService.incrementCacheVersion('tours');
      }

      return {
        message: `${uploaded.length} image(s) uploaded successfully`,
        images: tourDetail.images,
      };
    } catch (error) {
      throw new BadRequestException(
        'Failed to upload images: ' + error.message,
      );
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
        `TourDetail with ID ${tourDetailId} not found`,
      );
    }

    const currentImages: ITourImage[] = tourDetail.images || [];
    const imageToDelete = currentImages.find((img) => img.publicId === publicId);

    if (!imageToDelete) {
      throw new NotFoundException(
        `Image with publicId "${publicId}" not found in this tour detail`,
      );
    }

    try {
      await this.uploadService.deleteImage(publicId);
    } catch (err) {
      // Không block nếu xóa Cloudinary thất bại
    }

    // Xóa khỏi mảng, thứ tự tự nhiên theo index
    const remaining = currentImages.filter((img) => img.publicId !== publicId);

    tourDetail.images = remaining;
    await this.tourDetailRepository.save(tourDetail);

    // Xóa cache của tour
    if (tourDetail.tour?.id) {
      await this.cacheService.del(`tours:${tourDetail.tour.id}`);
      await this.cacheService.incrementCacheVersion('tours');
    }

    return {
      message: 'Image deleted successfully',
      images: tourDetail.images,
    };
  }
}
