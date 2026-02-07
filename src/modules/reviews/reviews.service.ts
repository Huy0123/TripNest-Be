import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review } from './entities/review.entity';
import { Repository } from 'typeorm';
import { Tour } from '../tours/entities/tour.entity';
import { User } from '../users/entities/user.entity';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Tour)
    private readonly tourRepository: Repository<Tour>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly cacheService: CacheService,
  ) {}
  async create(createReviewDto: CreateReviewDto) {
    const { tourId, userId, rating, comment } = createReviewDto;
    const tour = await this.tourRepository.findOne({ where: { id: tourId } });
    if (!tour) throw new NotFoundException('Tour not found');

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const review = this.reviewRepository.create({
      tour,
      user,
      rating,
      comment,
    });
    
    await this.reviewRepository.save(review);
    
    // Invalidate cache
    await this.cacheService.del(`reviews:${tourId}`);

    return review;
  }

  async findAll(tourId: string) {
    const cacheKey = `reviews:${tourId}`;
    const cachedData = await this.cacheService.get(cacheKey);
    if (cachedData) return cachedData;

    const reviews = await this.reviewRepository.find({
      where: { tour: { id: tourId } },
      order: { createdAt: 'DESC' },
    });
    
    await this.cacheService.set(cacheKey, reviews, 1800000); // 30 mins
    return reviews;
  }

  findOne(id: number) {
    return `This action returns a #${id} review`;
  }

  update(id: number, updateReviewDto: UpdateReviewDto) {
    return `This action updates a #${id} review`;
  }

  remove(id: number) {
    return `This action removes a #${id} review`;
  }
}
