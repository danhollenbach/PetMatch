import { Test, TestingModule } from '@nestjs/testing';
import { AdoptionFairService } from './adoption_fair.service.js';

describe('AdoptionFairService', () => {
  let service: AdoptionFairService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdoptionFairService],
    }).compile();

    service = module.get<AdoptionFairService>(AdoptionFairService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
