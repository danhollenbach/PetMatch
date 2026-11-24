import { Module } from '@nestjs/common';
import { DonorService } from './donor.service.js';
import { DonorController } from './donor.controller.js';

@Module({
  controllers: [DonorController],
  providers: [DonorService],
})
export class DonorModule {}
