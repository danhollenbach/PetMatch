import { Module } from '@nestjs/common';
import { DonationService } from './donation.service.js';
import { DonationController } from './donation.controller.js';

@Module({
  controllers: [DonationController],
  providers: [DonationService],
})
export class DonationModule {}
