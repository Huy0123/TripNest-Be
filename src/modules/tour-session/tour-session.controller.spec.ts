import { Test, TestingModule } from '@nestjs/testing';
import { TourSessionController } from './tour-session.controller';
import { TourSessionService } from './tour-session.service';

describe('TourSessionController', () => {
  let controller: TourSessionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TourSessionController],
      providers: [TourSessionService],
    }).compile();

    controller = module.get<TourSessionController>(TourSessionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
