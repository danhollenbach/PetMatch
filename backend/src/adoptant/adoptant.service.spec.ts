import { Test, TestingModule } from '@nestjs/testing';
import { AdoptantService } from './adoptant.service.js';

describe('AdoptantService', () => {
  let service: AdoptantService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdoptantService],
    }).compile();

    service = module.get<AdoptantService>(AdoptantService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
