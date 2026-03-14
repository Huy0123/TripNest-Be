import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { MailService } from '../mail/mail.service';
import { BookingStatus } from '@/enums/booking-status.enum';
import dayjs from 'dayjs';

@Injectable()
export class BookingsCronService {
  private readonly logger = new Logger(BookingsCronService.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
    private readonly mailService: MailService,
  ) {}

  // Run every day at 08:00 AM server time
  @Cron('0 8 * * *', {
    name: 'trip_reminder_email',
  })
  async handleTripReminders() {
    this.logger.log('Starting daily trip reminder scan...');

    // Find target date (e.g., 3 days from now)
    const targetDate = dayjs().add(3, 'day').endOf('day').toDate();
    const currentDate = dayjs().toDate();

    try {
      // Find all bookings that are PAID, haven't been reminded, and departure is within 3 days.
      const queryBuilder = this.bookingsRepository.createQueryBuilder('booking')
        .leftJoinAndSelect('booking.user', 'user')
        .leftJoinAndSelect('booking.session', 'session')
        .leftJoinAndSelect('session.tour', 'tour')
        .where('booking.status = :status', { status: BookingStatus.PAID })
        .andWhere('booking.isReminderSent = :isReminderSent', { isReminderSent: false })
        .andWhere('session.startDate > :currentDate', { currentDate })
        .andWhere('session.startDate <= :targetDate', { targetDate });

      const upcomingBookings = await queryBuilder.getMany();

      if (!upcomingBookings.length) {
        this.logger.log('No upcoming trips requiring reminders today.');
        return;
      }

      this.logger.log(`Found ${upcomingBookings.length} bookings to remind.`);

      for (const booking of upcomingBookings) {
        if (!booking.user || !booking.user.email) continue;

        const customerName = booking.user.lastName ? `${booking.user.firstName} ${booking.user.lastName}` : (booking.user.lastName || booking.user.firstName || 'Customer');
        const tourName = booking.session?.tour?.name || 'Your amazing trip';
        const departureDate = dayjs(booking.session.startDate).format('DD/MM/YYYY');
        const departureTime = dayjs(booking.session.startDate).format('HH:mm');
        
        // Calculate exact days
        const daysUntilTrip = dayjs(booking.session.startDate).diff(dayjs(), 'day');

        try {
          await this.mailService.sendTripReminderEmail(booking.user.email, {
            bookingCode: booking.bookingCode,
            tourName,
            departureDate,
            daysUntilTrip: daysUntilTrip > 0 ? daysUntilTrip : 1, // At least 1 day away
            customerName,
            departureTime,
            totalGuests: (booking.adults || 0) + (booking.children || 0),
            duration: booking.session?.tour?.duration || 0,
            nights: booking.session?.tour?.duration ? booking.session?.tour?.duration - 1 : 0,
          });

          // Mark as sent
          booking.isReminderSent = true;
          await this.bookingsRepository.save(booking);

          this.logger.log(`Sent reminder for booking ${booking.id} to ${booking.user.email}`);
        } catch (emailError) {
          this.logger.error(`Failed to send reminder for booking ${booking.id}:`, emailError.stack);
        }
      }

      this.logger.log('Finished daily trip reminder scan.');
    } catch (error) {
      this.logger.error('Error scanning for trip reminders:', error.stack);
    }
  }
}
