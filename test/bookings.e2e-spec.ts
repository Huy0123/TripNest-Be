import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { CacheService } from '../src/modules/cache/cache.service';
import { getQueueToken } from '@nestjs/bullmq';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TourSession } from '../src/modules/tour-session/entities/tour-session.entity';
import { Booking } from '../src/modules/bookings/entities/booking.entity';

describe('BookingsController (e2e)', () => {
  let app: INestApplication;
  let mockCacheService = {
    acquireLock: jest.fn().mockResolvedValue(true),
    releaseLock: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn(),
    del: jest.fn(),
  };
  let mockQueue = {
    add: jest.fn(),
  };
  let mockTourSessionRepo = {
    findOne: jest.fn().mockResolvedValue({
      id: 'session-1',
      price: 100,
      capacity: 50,
      bookedCount: 0,
    }),
    save: jest.fn(),
  };
  let mockBookingRepo = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((booking) => Promise.resolve({ id: 'booking-1', ...booking })),
    findOne: jest.fn().mockResolvedValue({ id: 'booking-1', status: 'PAID', totalAmount: 200 }),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(CacheService)
      .useValue(mockCacheService)
      .overrideProvider(getQueueToken('booking'))
      .useValue(mockQueue)
      .overrideProvider(getRepositoryToken(TourSession))
      .useValue(mockTourSessionRepo)
      .overrideProvider(getRepositoryToken(Booking))
      .useValue(mockBookingRepo)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/bookings (POST)', () => {
    it('should create a booking', () => {
      return request(app.getHttpServer())
        .post('/bookings')
        .send({
          tourId: 'session-1',
          adults: 2,
          children: 0,
          infants: 0,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.message).toEqual('Booking created successfully');
          expect(res.body.bookingId).toEqual('booking-1');
          expect(mockQueue.add).toHaveBeenCalledWith(
            'check-payment-timeout',
            expect.anything(),
            expect.anything(),
          );
        });
    });
  });

  describe('/bookings/:id/refund (POST)', () => {
    it('should request a refund', () => {
      return request(app.getHttpServer())
        .post('/bookings/booking-1/refund')
        .expect(201)
        .expect((res) => {
          expect(res.body.message).toEqual('Refund request accepted');
          expect(mockQueue.add).toHaveBeenCalledWith(
            'refund',
            expect.objectContaining({ bookingId: 'booking-1' }),
          );
        });
    });
  });
});
