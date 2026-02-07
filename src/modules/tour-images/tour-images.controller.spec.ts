import { Test, TestingModule } from '@nestjs/testing';
import { TourImagesController } from './tour-images.controller';
import { TourImagesService } from './tour-images.service';

describe('TourImagesController', () => {
  let controller: TourImagesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TourImagesController],
      providers: [TourImagesService],
    }).compile();

    controller = module.get<TourImagesController>(TourImagesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
