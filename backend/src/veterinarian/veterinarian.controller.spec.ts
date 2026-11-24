import { Test, TestingModule } from '@nestjs/testing';
import { VeterinarianController } from './veterinarian.controller.js';
import { VeterinarianService } from './veterinarian.service.js';

describe('VeterinarianController', () => {
  let controller: VeterinarianController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VeterinarianController],
      providers: [VeterinarianService],
    }).compile();

    controller = module.get<VeterinarianController>(VeterinarianController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
