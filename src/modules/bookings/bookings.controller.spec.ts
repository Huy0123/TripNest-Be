import { Test, TestingModule } from '@nestjs/testing';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

describe('BookingsController', () => {
  let controller: BookingsController;
  let mockBookingsService: any;

  beforeEach(async () => {
    mockBookingsService = {
      createBooking: jest.fn(),
      refundBooking: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [
        { provide: BookingsService, useValue: mockBookingsService },
      ],
    }).compile();

    controller = module.get<BookingsController>(BookingsController);
  });

  describe('create', () => {
    it('should create a booking', async () => {
      const dto = { tourId: 't1' } as CreateBookingDto;
      mockBookingsService.createBooking.mockResolvedValue({ message: 'Success', bookingId: 'b1' });

      const result = await controller.create(dto);

      expect(mockBookingsService.createBooking).toHaveBeenCalledWith(dto, expect.any(String), expect.any(String));
      expect(result.message).toBe('Success');
    });
  });

  describe('refund', () => {
    it('should request refund', async () => {
      mockBookingsService.refundBooking.mockResolvedValue({ message: 'Refund accepted' });
      const result = await controller.refund('b1');
      expect(mockBookingsService.refundBooking).toHaveBeenCalledWith('b1');
      expect(result.message).toBe('Refund accepted');
    });
  });
});
