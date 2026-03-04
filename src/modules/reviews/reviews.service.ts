import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review } from './entities/review.entity';
import { In, Repository } from 'typeorm';
import { Tour } from '../tours/entities/tour.entity';
import { User } from '../users/entities/user.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { CacheService } from '../cache/cache.service';
import { BookingStatus } from '@/enums/booking-status.enum';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Tour)
    private readonly tourRepository: Repository<Tour>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    private readonly cacheService: CacheService,
  ) {}
  async create(createReviewDto: CreateReviewDto) {
    const { tourId, userId, rating, comment } = createReviewDto;
    const tour = await this.tourRepository.findOne({ where: { id: tourId } });
    if (!tour) throw new NotFoundException('Tour not found');

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const hasValidBooking = await this.bookingRepository.findOne({
      where: {
        user: { id: userId },
        session: { tour: { id: tourId } },
        status: In([BookingStatus.PAID]),
      },
    });

    if (!hasValidBooking) {
      throw new ForbiddenException(
        'You can only review tours that you have booked and paid for.',
      );
    }

    const review = this.reviewRepository.create({
      tour,
      user,
      rating,
      comment,
    });

    await this.reviewRepository.save(review);
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
    
    await this.cacheService.set(cacheKey, reviews, 1800_000); // 30 mins
    return reviews;
  }

  findOne(id: string) {
    return this.reviewRepository.findOne({ where: { id } });
  }

  update(id: string, updateReviewDto: UpdateReviewDto) {
    return this.reviewRepository.update(id, updateReviewDto);
  }

  remove(id: string) {
    return this.reviewRepository.softDelete(id);
  }
}
