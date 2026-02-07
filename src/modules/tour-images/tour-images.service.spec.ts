import { Test, TestingModule } from '@nestjs/testing';
import { TourImagesService } from './tour-images.service';

describe('TourImagesService', () => {
  let service: TourImagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TourImagesService],
    }).compile();

    service = module.get<TourImagesService>(TourImagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
