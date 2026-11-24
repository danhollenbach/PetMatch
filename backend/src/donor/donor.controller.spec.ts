import { Test, TestingModule } from '@nestjs/testing';
import { DonorController } from './donor.controller.js';
import { DonorService } from './donor.service.js';

describe('DonorController', () => {
  let controller: DonorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DonorController],
      providers: [DonorService],
    }).compile();

    controller = module.get<DonorController>(DonorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
