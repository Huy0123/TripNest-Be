import { Test, TestingModule } from '@nestjs/testing';
import { TourSessionService } from './tour-session.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TourSession } from './entities/tour-session.entity';
import { Tour } from '../tours/entities/tour.entity';
import { DepartureStatus } from '@/enums/departure-status.enum';
import { BadRequestException } from '@nestjs/common';

describe('TourSessionService', () => {
  let service: TourSessionService;
  let mockSessionRepo: any;
  let mockTourRepo: any;

  beforeEach(async () => {
    mockSessionRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    mockTourRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TourSessionService,
        { provide: getRepositoryToken(TourSession), useValue: mockSessionRepo },
        { provide: getRepositoryToken(Tour), useValue: mockTourRepo },
      ],
    }).compile();

    service = module.get<TourSessionService>(TourSessionService);
  });

  describe('updateBookedCount', () => {
    it('should update count and set SOLDOUT if full', async () => {
      const mockSession = { 
        id: 's1', 
        bookedCount: 40, 
        capacity: 50, 
        status: DepartureStatus.OPEN 
      };
      mockSessionRepo.findOne.mockResolvedValue(mockSession);
      mockSessionRepo.save.mockImplementation((s) => s);

      await service.updateBookedCount('s1', 10);

      expect(mockSessionRepo.save).toHaveBeenCalledWith(expect.objectContaining({
        bookedCount: 50,
        status: DepartureStatus.SOLDOUT
      }));
    });

    it('should reopen if count drops below capacity', async () => {
      const mockSession = { 
        id: 's1', 
        bookedCount: 50, 
        capacity: 50, 
        status: DepartureStatus.SOLDOUT 
      };
      mockSessionRepo.findOne.mockResolvedValue(mockSession);
      
      await service.updateBookedCount('s1', -1);

      expect(mockSessionRepo.save).toHaveBeenCalledWith(expect.objectContaining({
        bookedCount: 49,
        status: DepartureStatus.OPEN
      }));
    });
  });

  describe('create', () => {
    it('should throw if date is in past', async () => {
      mockTourRepo.findOne.mockResolvedValue({ id: 't1' });
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      await expect(service.create({
        tourId: 't1',
        startDate: pastDate,
        capacity: 10,
        price: 100
      })).rejects.toThrow(BadRequestException);
    });
  });
});
