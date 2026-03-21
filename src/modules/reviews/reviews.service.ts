import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import { ErrorMessages } from '@/constants/error-messages.constant';
import { CacheKeys } from '@/constants/cache-keys.constant';

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
    if (!tour) {
      throw new NotFoundException(ErrorMessages.NOT_FOUND.TOUR);
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(ErrorMessages.NOT_FOUND.USER);
    }

    // Check user has a paid booking for this tour
    const hasValidBooking = await this.bookingRepository.findOne({
      where: {
        user: { id: userId },
        session: { tour: { id: tourId } },
        status: In([BookingStatus.PAID]),
      },
    });
    if (!hasValidBooking) {
      throw new ForbiddenException(ErrorMessages.REVIEW.NO_PAID_BOOKING);
    }

    // Check duplicate review
    const existing = await this.reviewRepository.findOne({
      where: { tour: { id: tourId }, user: { id: userId } },
    });
    if (existing) {
      throw new HttpException(
        ErrorMessages.REVIEW.ALREADY_REVIEWED,
        HttpStatus.CONFLICT,
      );
    }

    const review = this.reviewRepository.create({ tour, user, rating, comment });
    await this.reviewRepository.save(review);
    await this.cacheService.del(CacheKeys.reviews.byTour(tourId));
    return review;
  }

  async findAll(tourId: string) {
    const cacheKey = CacheKeys.reviews.byTour(tourId);
    const cachedData = await this.cacheService.get(cacheKey);
    if (cachedData) return cachedData;

    const reviews = await this.reviewRepository.find({
      where: { tour: { id: tourId } },
      order: { createdAt: 'DESC' },
    });

    await this.cacheService.set(cacheKey, reviews, 1_800_000); // 30 min
    return reviews;
  }

  async findOne(id: string) {
    const review = await this.reviewRepository.findOne({ where: { id } });
    if (!review) throw new NotFoundException(ErrorMessages.NOT_FOUND.REVIEW);
    return review;
  }

  async update(id: string, updateReviewDto: UpdateReviewDto, userId: string) {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!review) throw new NotFoundException(ErrorMessages.NOT_FOUND.REVIEW);
    if (review.user.id !== userId) {
      throw new ForbiddenException(ErrorMessages.REVIEW.NOT_OWNER);
    }
    await this.reviewRepository.update(id, updateReviewDto);
    return this.reviewRepository.findOne({ where: { id } });
  }

  async remove(id: string, userId: string, isAdmin: boolean) {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!review) throw new NotFoundException(ErrorMessages.NOT_FOUND.REVIEW);
    if (!isAdmin && review.user.id !== userId) {
      throw new ForbiddenException(ErrorMessages.REVIEW.NOT_OWNER);
    }
    await this.reviewRepository.softDelete(id);
  }
}
