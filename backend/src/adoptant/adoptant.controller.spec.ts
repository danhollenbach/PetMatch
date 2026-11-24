import { Test, TestingModule } from '@nestjs/testing';
import { AdoptantController } from './adoptant.controller.js';
import { AdoptantService } from './adoptant.service.js';

describe('AdoptantController', () => {
  let controller: AdoptantController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdoptantController],
      providers: [AdoptantService],
    }).compile();

    controller = module.get<AdoptantController>(AdoptantController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
