import { Test, TestingModule } from '@nestjs/testing';
import { TourDetailsService } from './tour-details.service';

describe('TourDetailsService', () => {
  let service: TourDetailsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TourDetailsService],
    }).compile();

    service = module.get<TourDetailsService>(TourDetailsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
