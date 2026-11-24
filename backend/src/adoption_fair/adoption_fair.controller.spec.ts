import { Test, TestingModule } from '@nestjs/testing';
import { AdoptionFairController } from './adoption_fair.controller.js';
import { AdoptionFairService } from './adoption_fair.service.js';

describe('AdoptionFairController', () => {
  let controller: AdoptionFairController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdoptionFairController],
      providers: [AdoptionFairService],
    }).compile();

    controller = module.get<AdoptionFairController>(AdoptionFairController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
