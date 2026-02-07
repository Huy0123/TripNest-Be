import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { DataSource, Repository } from 'typeorm';
import { CacheService } from '../cache/cache.service';
import { TourSessionService } from '../tour-session/tour-session.service';
import { TourSession } from '../tour-session/entities/tour-session.entity';
import { BookingStatus } from '@/enums/booking-status.enum';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Payment, PaymentStatus } from '../payments/entities/payment.entity';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);
  constructor(
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
    private readonly dataSource: DataSource,
    private readonly cacheService: CacheService,
    private readonly tourSessionsService: TourSessionService,
    @InjectQueue('booking') private readonly bookingQueue: Queue,
  ) {}

  async createBooking(createBookingDto: CreateBookingDto, userId: string) {
    const { sessionId, adults, children, infants } = createBookingDto;
    const totalPeople = adults + children;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('SERIALIZABLE');

    try {
      // 1. Lock session row with FOR UPDATE
      const session = await queryRunner.manager
        .createQueryBuilder(TourSession, 'session')
        .where('session.id = :id', { id: sessionId })
        .setLock('pessimistic_write')
        .getOne();

      if (!session) {
        throw new HttpException('Tour session not found', HttpStatus.NOT_FOUND);
      }

      // 2. Check capacity atomically
      if (session.bookedCount + totalPeople > session.capacity) {
        throw new HttpException('Tour session is fully booked', HttpStatus.BAD_REQUEST);
      }

      // 3. Calculate prices
      const adultPrice = Number(session.price);
      const childPrice = Number(session.price) * 0.75;
      const infantPrice = Number(session.price) * 0.1;
      
      const totalAmount = 
        (adults * adultPrice) + 
        (children * childPrice) + 
        (infants * infantPrice);

      // 4. Create booking
      const booking = queryRunner.manager.create(Booking, {
        session,
        user: { id: userId } as any,
        adults,
        children,
        infants,
        adultPrice,
        childrenPrice: childPrice,
        infantPrice,
        totalAmount,
        status: BookingStatus.PENDING,
      });

      const savedBooking = await queryRunner.manager.save(booking);

      // 5. Update session capacity atomically
      await queryRunner.manager.update(TourSession, session.id, {
        bookedCount: session.bookedCount + totalPeople,
      });

      // 6. Create payment record
      const payment = queryRunner.manager.create(Payment, {
        booking: savedBooking,
        amount: totalAmount,
        status: PaymentStatus.PENDING,
        currency: 'VND',
      });
      await queryRunner.manager.save(payment);

      await queryRunner.commitTransaction();

      this.logger.log(`Booking created: ${savedBooking.id} (${savedBooking.bookingCode}) for user ${userId}`);
      
      // 7. Add timeout job AFTER commit
      await this.bookingQueue.add(
        'check-payment-timeout',
        { bookingId: savedBooking.id },
        { delay: 15 * 60 * 1000 }
      );

      return {  
        message: 'Booking created successfully', 
        bookingId: savedBooking.id,
        bookingCode: savedBooking.bookingCode,
        totalAmount,
        paymentUrl: null
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Booking creation failed: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async refundBooking(bookingId: string) {
      const booking = await this.bookingsRepository.findOne({ where: { id: bookingId } });
      if (!booking) {
          throw new HttpException('Booking not found', HttpStatus.NOT_FOUND);
      }
      
      if (booking.status !== BookingStatus.PAID) {
          throw new HttpException('Booking is not eligible for refund', HttpStatus.BAD_REQUEST);
      }

      await this.bookingQueue.add('refund', { 
          bookingId: booking.id, 
          amount: booking.totalAmount, 
          reason: 'User requested' 
      });

      return { message: 'Refund request accepted' };
  }
}
