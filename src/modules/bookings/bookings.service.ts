import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { DataSource, Repository } from 'typeorm';
import { CacheService } from '../cache/cache.service';
import { TourSession } from '../tour-session/entities/tour-session.entity';
import { BookingStatus } from '@/enums/booking-status.enum';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Payment } from '../payments/entities/payment.entity';
import { PaymentStatus } from '@/enums/payment-status.enum';
import { EventsGateway } from '@/modules/websockets/events.gateway';
import { Promotion } from '../promotions/entities/promotion.entity';
import { DiscountType } from '@/enums/discount-type.enum';
import { MailService } from '../mail/mail.service';
import { ErrorMessages } from '@/constants/error-messages.constant';
import { CacheKeys } from '@/constants/cache-keys.constant';
import { generateBookingCode } from '@/utils/booking-code.util';

const PAYMENT_TIMEOUT_MS = 15 * 60 * 1000; // 15 phút

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
    const { sessionId, tourId, adults, children, promoCode, customerName, customerEmail, customerPhone } = createBookingDto;
    const totalPeople = adults + children;

    const cacheKey = `booking_lock:${userId}:${sessionId}`;
    const isLocked = await this.cacheService.acquireLock(cacheKey, 5_000); // 5 giây
    if (!isLocked) {
      throw new HttpException(
        ErrorMessages.BOOKING.RATE_LIMIT,
        HttpStatus.TOO_MANY_REQUESTS,
      );
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
        throw new HttpException(
          ErrorMessages.NOT_FOUND.SESSION,
          HttpStatus.NOT_FOUND,
        );
      }

      if (session.bookedCount + totalPeople > session.capacity) {
        throw new HttpException(
          ErrorMessages.BOOKING.SESSION_FULL,
          HttpStatus.BAD_REQUEST,
        );
      }

      const adultPrice = Number(session.adultPrice);
      const childPrice = Number(session.childrenPrice);
      let totalAmount = adults * adultPrice + children * childPrice;
      let discountAmount = 0;
      let appliedPromotion: Promotion | null = null;

      if (promoCode) {
        appliedPromotion = await queryRunner.manager
          .createQueryBuilder(Promotion, 'promo')
          .where('promo.code = :code', { code: promoCode })
          .setLock('pessimistic_write')
          .getOne();

        if (!appliedPromotion) {
          throw new HttpException(
            ErrorMessages.PROMO.INVALID,
            HttpStatus.BAD_REQUEST,
          );
        }
        if (!appliedPromotion.isActive) {
          throw new HttpException(
            ErrorMessages.PROMO.INACTIVE,
            HttpStatus.BAD_REQUEST,
          );
        }

        const now = new Date();
        if (
          now < appliedPromotion.startDate ||
          now > appliedPromotion.endDate
        ) {
          throw new HttpException(
            ErrorMessages.PROMO.EXPIRED,
            HttpStatus.BAD_REQUEST,
          );
        }
        if (
          appliedPromotion.usageLimit > 0 &&
          appliedPromotion.usedCount >= appliedPromotion.usageLimit
        ) {
          throw new HttpException(
            ErrorMessages.PROMO.LIMIT_REACHED,
            HttpStatus.BAD_REQUEST,
          );
        }
        if (totalAmount < appliedPromotion.minOrderValue) {
          throw new HttpException(
            ErrorMessages.PROMO.MIN_ORDER,
            HttpStatus.BAD_REQUEST,
          );
        }

        if (appliedPromotion.discountType === DiscountType.FIXED_AMOUNT) {
          discountAmount = appliedPromotion.discountValue;
        } else if (
          appliedPromotion.discountType === DiscountType.PERCENTAGE
        ) {
          discountAmount =
            (totalAmount * appliedPromotion.discountValue) / 100;
          if (
            appliedPromotion.maxDiscount &&
            discountAmount > appliedPromotion.maxDiscount
          ) {
            discountAmount = appliedPromotion.maxDiscount;
          }
        }

        totalAmount = Math.max(0, totalAmount - discountAmount);

        await queryRunner.manager.update(Promotion, appliedPromotion.id, {
          usedCount: appliedPromotion.usedCount + 1,
        });
      }

      // Generate crypto-safe booking code within transaction
      const bookingCode = await generateBookingCode(this.bookingsRepository);

      const booking = queryRunner.manager.create(Booking, {
        bookingCode,
        customerName,
        customerEmail,
        customerPhone,
        session,
        tour: { id: tourId } as any,
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

      await queryRunner.commitTransaction();

      this.eventsGateway.broadcastSessionUpdate(
        session.id,
        session.bookedCount + totalPeople,
        session.capacity,
        session.status,
      );

      this.logger.log(
        `Đặt chỗ thành công: ${savedBooking.id} (${savedBooking.bookingCode}) cho user ${userId}`,
      );

      const job = await this.bookingQueue.add(
        'check-payment-timeout',
        { bookingId: savedBooking.id },
        { delay: PAYMENT_TIMEOUT_MS },
      );

      // Store job ID for O(1) removal on payment success
      await this.bookingsRepository.update(savedBooking.id, {
        paymentTimeoutJobId: String(job.id),
      });

      await this.cacheService.del(CacheKeys.bookings.byUser(userId));

      return {
        id: savedBooking.id,
        bookingId: savedBooking.id,
        bookingCode: savedBooking.bookingCode,
        totalAmount,
        discountAmount,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Tạo đặt chỗ thất bại: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
      await this.cacheService.releaseLock(cacheKey);
    }
  }

  async findAllByUserId(userId: string) {
    const cacheKey = CacheKeys.bookings.byUser(userId);
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
      throw new HttpException(
        ErrorMessages.BOOKING.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
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
        throw new HttpException(
          ErrorMessages.BOOKING.NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }

      if (booking.status !== BookingStatus.PENDING) {
        throw new HttpException(
          ErrorMessages.BOOKING.CANCEL_ONLY_PENDING,
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
            session.status,
          );
        }
      }

      await queryRunner.commitTransaction();

      await this.cacheService.del(CacheKeys.bookings.byUser(userId));
      this.logger.log(`Đặt chỗ ${bookingId} đã bị hủy bởi user ${userId}`);

      return { bookingId, status: BookingStatus.CANCELED };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Hủy đặt chỗ thất bại: ${error.message}`, error.stack);
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
        lock: { mode: 'pessimistic_write' },
        loadEagerRelations: false,
      });

      if (!booking) {
        throw new HttpException(
          ErrorMessages.BOOKING.NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }

      // Reload with relations for subsequent logic
      const bookingWithRelations = await queryRunner.manager.findOne(Booking, {
        where: { id: bookingId },
        relations: ['user', 'tour'],
      });

      booking.status = BookingStatus.PAID;
      await queryRunner.manager.save(booking);

      await queryRunner.manager.update(
        Payment,
        { booking: { id: bookingId } },
        { status: PaymentStatus.COMPLETED },
      );

      if (bookingWithRelations?.user) {
        await this.cacheService.del(
          CacheKeys.bookings.byUser(bookingWithRelations.user.id),
        );
      }

      await queryRunner.commitTransaction();

      // O(1) job removal using stored job ID
      if (booking.paymentTimeoutJobId) {
        const job = await this.bookingQueue.getJob(booking.paymentTimeoutJobId);
        await job?.remove();
        this.logger.log(
          `Đã xóa timeout job cho đặt chỗ ${bookingId}`,
        );
      }

      if (booking.customerEmail) {

        this.mailService
          .sendPaymentSuccessEmail(booking.customerEmail, {
            bookingCode: booking.bookingCode,
            tourName: bookingWithRelations?.tour?.name || 'Chuyến đi của bạn',
            amount: booking.totalAmount,
            paymentDate: new Date().toLocaleString('vi-VN'),
            customerName: booking.customerName,
          })
          .catch((err) => {
            this.logger.error(
              `Không thể gửi email xác nhận thanh toán tới ${booking.customerEmail}:`,
              err,
            );
          });
      }

      this.logger.log(`Xác nhận thanh toán thành công cho đặt chỗ ${bookingId}`);
      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Xác nhận thanh toán thất bại cho đặt chỗ ${bookingId}: ${error.message}`,
        error.stack,
      );
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
        lock: { mode: 'pessimistic_write' },
        loadEagerRelations: false,
      });

      if (!booking || booking.status !== BookingStatus.PENDING) {
        await queryRunner.rollbackTransaction();
        return;
      }

      // Reload with session for restoration
      const bookingWithSession = await queryRunner.manager.findOne(Booking, {
        where: { id: bookingId },
        relations: ['user', 'session'],
      });

      booking.status = BookingStatus.CANCELED;
      await queryRunner.manager.save(booking);

      await queryRunner.manager.update(
        Payment,
        { booking: { id: bookingId } },
        { status: PaymentStatus.FAILED },
      );

      if (bookingWithSession?.user) {
        await this.cacheService.del(
          CacheKeys.bookings.byUser(bookingWithSession.user.id),
        );
      }

      if (bookingWithSession?.session) {
        const session = await queryRunner.manager
          .createQueryBuilder(TourSession, 'session')
          .where('session.id = :id', { id: bookingWithSession.session.id })
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
            session.status,
          );
        }
      }

      await queryRunner.commitTransaction();
      this.logger.log(
        `Thanh toán thất bại cho đặt chỗ ${bookingId}. Đã hủy và hoàn lại chỗ.`,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Lỗi khi xử lý thanh toán thất bại cho đặt chỗ ${bookingId}: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
