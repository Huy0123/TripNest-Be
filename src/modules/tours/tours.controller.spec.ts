import { Test, TestingModule } from '@nestjs/testing';
import { ToursController } from './tours.controller';
import { ToursService } from './tours.service';
import { CreateTourDto } from './dto/create-tour.dto';

describe('ToursController', () => {
  let controller: ToursController;
  let mockToursService: any;

  beforeEach(async () => {
    mockToursService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      findByLocation: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ToursController],
      providers: [
        { provide: ToursService, useValue: mockToursService },
      ],
    }).compile();

    controller = module.get<ToursController>(ToursController);
  });

  describe('create', () => {
    it('should create a tour', async () => {
      const dto = { name: 'New Tour' } as CreateTourDto;
      mockToursService.create.mockResolvedValue({ id: '1', ...dto });

      const result = await controller.create(dto);

      expect(mockToursService.create).toHaveBeenCalledWith(dto);
      expect(result.message).toBe('Tour created successfully');
      expect(result.data).toHaveProperty('id', '1');
    });
  });

  describe('findAll', () => {
    it('should return paginated tours', async () => {
      const mockResult = { data: [{ id: '1' }], total: 1, page: 1, limit: 10 };
      mockToursService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll({} as any);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a tour', async () => {
      mockToursService.findOne.mockResolvedValue({ id: '1' });
      const result = await controller.findOne('1');
      expect(result.data).toHaveProperty('id', '1');
    });
  });

  describe('update', () => {
    it('should update a tour', async () => {
      mockToursService.update.mockResolvedValue({ id: '1', name: 'Upp' });
      const result = await controller.update('1', { name: 'Upp' });
      expect(result.data).toHaveProperty('name', 'Upp');
    });
  });
});
