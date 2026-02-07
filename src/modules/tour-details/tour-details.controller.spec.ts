import { Test, TestingModule } from '@nestjs/testing';
import { TourDetailsController } from './tour-details.controller';
import { TourDetailsService } from './tour-details.service';

describe('TourDetailsController', () => {
  let controller: TourDetailsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TourDetailsController],
      providers: [TourDetailsService],
    }).compile();

    controller = module.get<TourDetailsController>(TourDetailsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
