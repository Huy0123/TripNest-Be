import { Test, TestingModule } from '@nestjs/testing';
import { BookingProcessor } from './booking.processor';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Booking } from '../entities/booking.entity';
import { TourSessionService } from '@/modules/tour-session/tour-session.service';
import { BookingStatus } from '@/enums/booking-status.enum';
import { Job } from 'bullmq';

describe('BookingProcessor', () => {
  let processor: BookingProcessor;
  let mockBookingRepo: any;
  let mockTourSessionService: any;

  beforeEach(async () => {
    mockBookingRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    };
    mockTourSessionService = {
      updateBookedCount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingProcessor,
        { provide: getRepositoryToken(Booking), useValue: mockBookingRepo },
        { provide: TourSessionService, useValue: mockTourSessionService },
      ],
    }).compile();

    processor = module.get<BookingProcessor>(BookingProcessor);
  });

  describe('handleCheckPaymentTimeout', () => {
    it('should cancel booking and revert capacity if pending', async () => {
      const mockJob = { data: { bookingId: 'b1' } } as Job;
      const mockBooking = { 
        id: 'b1', 
        status: BookingStatus.PENDING, 
        session: { id: 's1' },
        adults: 2,
        children: 1 
      };
      
      mockBookingRepo.findOne.mockResolvedValue(mockBooking);
      mockBookingRepo.save.mockResolvedValue({ ...mockBooking, status: BookingStatus.CANCELED });

      await processor.handleCheckPaymentTimeout(mockJob);

      expect(mockBookingRepo.save).toHaveBeenCalledWith(expect.objectContaining({ 
        status: BookingStatus.CANCELED 
      }));
      expect(mockTourSessionService.updateBookedCount).toHaveBeenCalledWith('s1', -3);
    });

    it('should do nothing if booking paid or not found', async () => {
      const mockJob = { data: { bookingId: 'b1' } } as Job;
      mockBookingRepo.findOne.mockResolvedValue(null);

      await processor.handleCheckPaymentTimeout(mockJob);

      expect(mockBookingRepo.save).not.toHaveBeenCalled();
      expect(mockTourSessionService.updateBookedCount).not.toHaveBeenCalled();
    });
  });

  describe('handleRefund', () => {
    it('should update status to REFUNDED', async () => {
      const mockJob = { data: { bookingId: 'b1' } } as Job;
      const mockBooking = { id: 'b1', status: BookingStatus.PAID };
      mockBookingRepo.findOne.mockResolvedValue(mockBooking);

      await processor.handleRefund(mockJob);

      expect(mockBookingRepo.save).toHaveBeenCalledWith(expect.objectContaining({
        status: BookingStatus.REFUNDED
      }));
    });
  });
});
