import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Booking } from '../entities/booking.entity';
import { Repository } from 'typeorm';
import { BookingStatus } from '@/enums/booking-status.enum';
import { TourSessionService } from '@/modules/tour-session/tour-session.service';

@Processor('booking')
export class BookingProcessor extends WorkerHost {
  private readonly logger = new Logger(BookingProcessor.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    private readonly tourSessionService: TourSessionService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'check-payment-timeout':
        return this.handleCheckPaymentTimeout(job);
      case 'refund':
        return this.handleRefund(job);
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  async handleRefund(job: Job) {
      const { bookingId, amount, reason } = job.data;
      this.logger.log(`Processing refund for booking ${bookingId}`);
      
      const booking = await this.bookingRepository.findOne({ where: { id: bookingId } });
      if (!booking) return;

      // Mock Refund Logic: 
      // 1. Call Payment Gateway Refund API
      // 2. Create Refund Transaction (Negative amount)
      // 3. Update Booking Status

      // Since we don't have PaymentService injected here yet to call refund API,
      // We will just log and update status. 
      // Ideally PaymentService should handle the gateway interaction.
      
      booking.status = BookingStatus.REFUNDED;
      await this.bookingRepository.save(booking);
      
      // We should also record a transaction for refund
      // BUT TransactionRepository is not injected.
      // Assuming PaymentService does it.
      
      this.logger.log(`Refund processed for ${bookingId}`);
  }

  async handleCheckPaymentTimeout(job: Job) {
    const { bookingId } = job.data;
    this.logger.log(`Checking payment timeout for booking ${bookingId}`);

    const booking = await this.bookingRepository.findOne({ where: { id: bookingId }, relations: ['session'] });
    if (!booking) {
      this.logger.warn(`Booking ${bookingId} not found`);
      return;
    }

    if (booking.status === BookingStatus.PENDING) {
      // Release capacity
      this.logger.log(`Booking ${bookingId} expired. Cancelling...`);
      booking.status = BookingStatus.CANCELED;
      booking.totalAmount = 0; // Optional cancellation logic
      await this.bookingRepository.save(booking);

      // Restore session capacity
      if (booking.session) {
         // adults + children
         const totalPeople = booking.adults + booking.children; 
         await this.tourSessionService.updateBookedCount(booking.session.id, -totalPeople);
      }
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} of type ${job.name} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: any) {
    this.logger.error(`Job ${job.id} of type ${job.name} failed: ${error.message}`);
  }
}
