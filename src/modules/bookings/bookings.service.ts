import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { DataSource, Repository } from 'typeorm';
import { CacheService } from '../cache/cache.service';
import { TourSession } from '../tour-session/entities/tour-session.entity';
import { BookingStatus } from '@/enums/booking-status.enum';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Payment, PaymentStatus } from '../payments/entities/payment.entity';
import { EventsGateway } from '@/modules/websockets/events.gateway'
import { Promotion, DiscountType } from '../promotions/entities/promotion.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);
  constructor(
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
    private readonly dataSource: DataSource,
    private readonly cacheService: CacheService,
    @InjectQueue('booking') private readonly bookingQueue: Queue,
    private readonly eventsGateway: EventsGateway,
    private readonly mailService: MailService,
  ) {}

  async createBooking(createBookingDto: CreateBookingDto, userId: string) {
    const { sessionId, adults, children, promoCode } = createBookingDto;
    const totalPeople = adults + children;

    const cacheKey = `booking_lock:${userId}:${sessionId}`;
    const isLocked = await this.cacheService.acquireLock(cacheKey, 5_000); // 5ms
    if (!isLocked) {
      throw new HttpException('Please wait a moment before booking again', HttpStatus.TOO_MANY_REQUESTS);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('SERIALIZABLE');

    try {
      const session = await queryRunner.manager
        .createQueryBuilder(TourSession, 'session')
        .where('session.id = :id', { id: sessionId })
        .setLock('pessimistic_write')
        .getOne();

      if (!session) {
        throw new HttpException('Tour session not found', HttpStatus.NOT_FOUND);
      }

      if (session.bookedCount + totalPeople > session.capacity) {
        throw new HttpException('Tour session is fully booked', HttpStatus.BAD_REQUEST);
      }
      const adultPrice = Number(session.adultPrice);
      const childPrice = Number(session.childrenPrice);
      
      let totalAmount = (adults * adultPrice) + (children * childPrice);

      let discountAmount = 0;
      let appliedPromotion: Promotion | null = null;

      if (promoCode) {
        appliedPromotion = await queryRunner.manager
          .createQueryBuilder(Promotion, 'promo')
          .where('promo.code = :code', { code: promoCode })
          .setLock('pessimistic_write')
          .getOne();

        if (!appliedPromotion) {
          throw new HttpException('Invalid promo code', HttpStatus.BAD_REQUEST);
        }
        if (!appliedPromotion.isActive) {
          throw new HttpException('Promo code is not active', HttpStatus.BAD_REQUEST);
        }
        
        const now = new Date();
        if (now < appliedPromotion.startDate || now > appliedPromotion.endDate) {
          throw new HttpException('Promo code is expired or not yet valid', HttpStatus.BAD_REQUEST);
        }
        if (appliedPromotion.usageLimit > 0 && appliedPromotion.usedCount >= appliedPromotion.usageLimit) {
          throw new HttpException('Promo code usage limit has been reached', HttpStatus.BAD_REQUEST);
        }
        if (totalAmount < appliedPromotion.minOrderValue) {
          throw new HttpException(`Minimum order value of ${appliedPromotion.minOrderValue} is required`, HttpStatus.BAD_REQUEST);
        }

        if (appliedPromotion.discountType === DiscountType.FIXED_AMOUNT) {
          discountAmount = appliedPromotion.discountValue;
        } else if (appliedPromotion.discountType === DiscountType.PERCENTAGE) {
          discountAmount = (totalAmount * appliedPromotion.discountValue) / 100;
          if (appliedPromotion.maxDiscount && discountAmount > appliedPromotion.maxDiscount) {
            discountAmount = appliedPromotion.maxDiscount;
          }
        }

        totalAmount = Math.max(0, totalAmount - discountAmount);

        await queryRunner.manager.update(Promotion, appliedPromotion.id, {
          usedCount: appliedPromotion.usedCount + 1,
        });
      }

      const booking = queryRunner.manager.create(Booking, {
        session,
        user: { id: userId } as any,
        adults,
        children,
        adultPrice,
        childrenPrice: childPrice,
        totalAmount,
        discountAmount,
        ...(appliedPromotion ? { promotion: appliedPromotion } : {}),
        status: BookingStatus.PENDING,
      });

      const savedBooking = await queryRunner.manager.save(booking);

      await queryRunner.manager.update(TourSession, session.id, {
        bookedCount: session.bookedCount + totalPeople,
      });
      const payment = queryRunner.manager.create(Payment, {
        booking: savedBooking,
        amount: totalAmount,
        status: PaymentStatus.PENDING,
        currency: 'VND',
      });
      await queryRunner.manager.save(payment);

      await queryRunner.commitTransaction();

      this.eventsGateway.broadcastSessionUpdate(
        session.id,
        session.bookedCount + totalPeople,
        session.capacity,
        session.status 
      );

      this.logger.log(`Booking created: ${savedBooking.id} (${savedBooking.bookingCode}) for user ${userId}`);
      
      await this.bookingQueue.add(
        'check-payment-timeout',
        { bookingId: savedBooking.id },
        { delay: 15 * 60 * 1000 }
      );

      await this.cacheService.del(`bookings:user:${userId}`);
      await this.cacheService.releaseLock(cacheKey);

      return {  
        message: 'Booking created successfully', 
        bookingId: savedBooking.id,
        bookingCode: savedBooking.bookingCode,
        totalAmount,
        discountAmount,
        paymentUrl: null
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      await this.cacheService.releaseLock(cacheKey);
      this.logger.error(`Booking creation failed: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAllByUserId(userId: string) {
    const cacheKey = `bookings:user:${userId}`;
    const cachedData = await this.cacheService.get<string>(cacheKey);
    
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const bookings = await this.bookingsRepository.find({
      where: { user: { id: userId } },
      relations: ['session', 'session.tour'],
      order: { createdAt: 'DESC' },
    });

    await this.cacheService.set(cacheKey, bookings, 300_000);

    return bookings;
  }

  async findOne(bookingId: string, userId: string) {
    const booking = await this.bookingsRepository.findOne({
      where: { id: bookingId, user: { id: userId } },
      relations: ['session', 'session.tour', 'payments', 'promotion'],
    });

    if (!booking) {
      throw new HttpException('Booking not found', HttpStatus.NOT_FOUND);
    }

    return booking;
  }

  async cancelBooking(bookingId: string, userId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('SERIALIZABLE');

    try {
      const booking = await queryRunner.manager.findOne(Booking, {
        where: { id: bookingId, user: { id: userId } },
        relations: ['session'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!booking) {
        throw new HttpException('Booking not found', HttpStatus.NOT_FOUND);
      }

      if (booking.status !== BookingStatus.PENDING) {
        throw new HttpException(
          'Chỉ có thể hủy những booking đang chờ thanh toán',
          HttpStatus.BAD_REQUEST,
        );
      }

      booking.status = BookingStatus.CANCELED;
      await queryRunner.manager.save(booking);

      if (booking.session) {
        const session = await queryRunner.manager
          .createQueryBuilder(TourSession, 'session')
          .where('session.id = :id', { id: booking.session.id })
          .setLock('pessimistic_write')
          .getOne();

        if (session) {
          const totalPeople = booking.adults + booking.children;
          session.bookedCount = Math.max(0, session.bookedCount - totalPeople);
          await queryRunner.manager.save(session);
          this.eventsGateway.broadcastSessionUpdate(
            session.id,
            session.bookedCount,
            session.capacity,
            session.status
          );
        }
      }

      await queryRunner.commitTransaction();

      await this.cacheService.del(`bookings:user:${userId}`);
      this.logger.log(`Booking ${bookingId} was manually cancelled by user ${userId}`);

      return { message: 'Đã hủy booking thành công' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Manual cancel failed: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async confirmPaymentSuccess(bookingId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('SERIALIZABLE');

    try {
      const booking = await queryRunner.manager.findOne(Booking, {
        where: { id: bookingId },
        relations: ['user'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!booking) {
        throw new HttpException('Booking not found', HttpStatus.NOT_FOUND);
      }

      booking.status = BookingStatus.PAID;
      await queryRunner.manager.save(booking);

      await queryRunner.manager.update(Payment, { booking: { id: bookingId } }, {
        status: PaymentStatus.COMPLETED,
      });

      if (booking.user) {
        await this.cacheService.del(`bookings:user:${booking.user.id}`);
      }

      await queryRunner.commitTransaction();
      const jobs = await this.bookingQueue.getDelayed();
      for (const job of jobs) {
        if (job.name === 'check-payment-timeout' && job.data.bookingId === bookingId) {
          await job.remove();
          this.logger.log(`Removed timeout job for booking ${bookingId}`);
          break;
        }
      }

      if (booking.user && booking.user.email) {
        const fullSession = await this.dataSource.manager.findOne(TourSession, {
          where: { id: booking.session.id },
          relations: ['tour']
        });
        const tourName = fullSession?.tour?.name || 'Chuyến đi của bạn';

        this.mailService.sendPaymentSuccessEmail(booking.user.email, {
          bookingCode: booking.bookingCode,
          tourName: tourName,
          amount: booking.totalAmount,
          paymentDate: new Date().toLocaleString('vi-VN'),
          customerName: booking.user.lastName ? `${booking.user.firstName} ${booking.user.lastName}` : booking.user.lastName || booking.user.firstName,
        }).catch(err => {
          this.logger.error(`Could not send payment success email to ${booking.user.email}:`, err);
        });
      }

      this.logger.log(`Payment confirmed successfully for booking ${bookingId}`);
      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to confirm payment for booking ${bookingId}: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async handlePaymentFailure(bookingId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('SERIALIZABLE');

    try {
      const booking = await queryRunner.manager.findOne(Booking, {
        where: { id: bookingId },
        relations: ['user', 'session'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!booking || booking.status !== BookingStatus.PENDING) {
        await queryRunner.rollbackTransaction();
        return; // Already handled or not found
      }

      booking.status = BookingStatus.CANCELED;
      await queryRunner.manager.save(booking);

      await queryRunner.manager.update(Payment, { booking: { id: bookingId } }, {
        status: PaymentStatus.FAILED,
      });

      if (booking.user) {
        await this.cacheService.del(`bookings:user:${booking.user.id}`);
      }

      if (booking.session) {
        const session = await queryRunner.manager
          .createQueryBuilder(TourSession, 'session')
          .where('session.id = :id', { id: booking.session.id })
          .setLock('pessimistic_write')
          .getOne();

        if (session) {
          const totalPeople = booking.adults + booking.children;
          session.bookedCount = Math.max(0, session.bookedCount - totalPeople);
          await queryRunner.manager.save(session);
          this.eventsGateway.broadcastSessionUpdate(
            session.id,
            session.bookedCount,
            session.capacity,
            session.status
          );
        }
      }

      await queryRunner.commitTransaction();
      this.logger.log(`Payment failed for booking ${bookingId}. Booking cancelled and capacity released.`);
      
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error handling payment failure for booking ${bookingId}: ${error.message}`, error.stack);
    } finally {
      await queryRunner.release();
    }
  }
}
