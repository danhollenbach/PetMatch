import { Module } from '@nestjs/common';
import { AdoptionFairService } from './adoption_fair.service.js';
import { AdoptionFairController } from './adoption_fair.controller.js';

@Module({
  controllers: [AdoptionFairController],
  providers: [AdoptionFairService],
})
export class AdoptionFairModule {}
