import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from './bookings.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { CacheService } from '../cache/cache.service';
import { TourSessionService } from '../tour-session/tour-session.service';
import { getQueueToken } from '@nestjs/bullmq';
import { BookingStatus } from '@/enums/booking-status.enum';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('BookingsService', () => {
  let service: BookingsService;
  let mockBookingRepo: any;
  let mockCacheService: any;
  let mockTourSessionService: any;
  let mockQueue: any;

  beforeEach(async () => {
    mockBookingRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };
    mockCacheService = {
      acquireLock: jest.fn(),
      releaseLock: jest.fn(),
    };
    mockTourSessionService = {
      findOne: jest.fn(),
      updateBookedCount: jest.fn(),
    };
    mockQueue = {
      add: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: getRepositoryToken(Booking),
          useValue: mockBookingRepo,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: TourSessionService,
          useValue: mockTourSessionService,
        },
        {
          provide: getQueueToken('booking'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createBooking', () => {
    const mockDto = {
      tourId: 'session-123',
      adults: 2,
      children: 1,
      infants: 0,
    };
    const mockSession = {
      id: 'session-123',
      price: 100,
      capacity: 10,
      bookedCount: 0,
    };

    it('should create booking successfully', async () => {
      mockCacheService.acquireLock.mockResolvedValue(true);
      mockTourSessionService.findOne.mockResolvedValue(mockSession);
      mockBookingRepo.create.mockReturnValue({ id: 'booking-1', ...mockDto });
      mockBookingRepo.save.mockResolvedValue({ id: 'booking-1', ...mockDto });

      const result = await service.createBooking(mockDto as any, 'test@test.com', '123');

      expect(mockCacheService.acquireLock).toHaveBeenCalled();
      expect(mockTourSessionService.updateBookedCount).toHaveBeenCalledWith('session-123', 3);
      expect(mockQueue.add).toHaveBeenCalledWith('check-payment-timeout', expect.any(Object), expect.any(Object));
      expect(mockCacheService.releaseLock).toHaveBeenCalled();
      expect(result.message).toBe('Booking created successfully');
    });

    it('should throw when system is locked', async () => {
      mockCacheService.acquireLock.mockResolvedValue(false);

      await expect(service.createBooking(mockDto as any, 'test@test.com', '123'))
        .rejects.toThrow(new HttpException('System is busy, please try again later', HttpStatus.TOO_MANY_REQUESTS));
        
      expect(mockCacheService.releaseLock).not.toHaveBeenCalled(); // Lock wasn't acquired
    });

    it('should throw when capacity is full', async () => {
      mockCacheService.acquireLock.mockResolvedValue(true);
      mockTourSessionService.findOne.mockResolvedValue({ ...mockSession, bookedCount: 10 });

      await expect(service.createBooking(mockDto as any, 'test@test.com', '123'))
        .rejects.toThrow(new HttpException('Tour session is fully booked', HttpStatus.BAD_REQUEST));

      expect(mockCacheService.releaseLock).toHaveBeenCalled();
    });
  });

  describe('refundBooking', () => {
    it('should queue refund job if paid', async () => {
      mockBookingRepo.findOne.mockResolvedValue({ id: 'b1', status: BookingStatus.PAID, totalAmount: 100 });

      await service.refundBooking('b1');

      expect(mockQueue.add).toHaveBeenCalledWith('refund', {
        bookingId: 'b1',
        amount: 100,
        reason: 'User requested',
      });
    });

    it('should throw if booking not paid', async () => {
      mockBookingRepo.findOne.mockResolvedValue({ id: 'b1', status: BookingStatus.PENDING });

      await expect(service.refundBooking('b1'))
        .rejects.toThrow(new HttpException('Booking is not eligible for refund', HttpStatus.BAD_REQUEST));
    });
  });
});
