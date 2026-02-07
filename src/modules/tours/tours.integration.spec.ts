import { Test, TestingModule } from '@nestjs/testing';
import { ToursService } from './tours.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Tour } from './entities/tour.entity';
import { Location } from '../location/entities/location.entity';
import { CacheService } from '@/modules/cache/cache.service';

describe('ToursService (Integration)', () => {
  let service: ToursService;
  let mockTourRepo: any;
  let mockLocationRepo: any;
  let mockCacheService: any;
  let mockQueryBuilder: any;

  beforeEach(async () => {
    mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };

    mockTourRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      remove: jest.fn(),
    };

    mockLocationRepo = {
      findOne: jest.fn(),
    };

    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToursService,
        { provide: getRepositoryToken(Tour), useValue: mockTourRepo },
        { provide: getRepositoryToken(Location), useValue: mockLocationRepo },
        { provide: CacheService, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get<ToursService>(ToursService);
  });

  describe('findAll (Cache & Query)', () => {
    it('should return cached data if available', async () => {
      const cachedResult = { data: [{ id: '1' }], total: 1 };
      mockCacheService.get.mockImplementation((key) => {
        if (key.startsWith('tours:list')) return cachedResult;
        if (key === 'tours:version') return 5;
        return null;
      });

      const result = await service.findAll({});

      expect(result).toBe(cachedResult);
      expect(mockTourRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should query DB and cache result on cache miss', async () => {
      mockCacheService.get.mockReturnValue(null);
      const dbResult = [[{ id: '1' }], 1];
      mockQueryBuilder.getManyAndCount.mockResolvedValue(dbResult);

      const query = { minPrice: 100, search: 'Beach' };
      const result = await service.findAll(query);

      expect(mockTourRepo.createQueryBuilder).toHaveBeenCalled();
      // Verify filters applied
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('tour.price >= :minPrice'),
        { minPrice: 100 }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
          expect.stringContaining('tour.name ILIKE :search'),
          { search: '%Beach%' }
      );
      
      // Verify caching
      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.stringMatching(/tours:list:v0:/),
        { data: dbResult[0], total: dbResult[1], page: 1, limit: 10 },
        86400000
      );
      expect(result.data).toEqual(dbResult[0]);
    });
  });

  describe('State Change & Cache Invalidation', () => {
    it('should invalidate cache on update', async () => {
      mockTourRepo.findOne.mockResolvedValue({ id: 't1' });
      mockTourRepo.save.mockResolvedValue({ id: 't1' });
      mockCacheService.get.mockReturnValue(0); // version 0

      await service.update('t1', { name: 'New Name' });

      // Verify version increment
      expect(mockCacheService.set).toHaveBeenCalledWith('tours:version', 1, 0);
      // Verify specific tour cache deletion
      expect(mockCacheService.del).toHaveBeenCalledWith('tours:t1');
    });
  });
});
