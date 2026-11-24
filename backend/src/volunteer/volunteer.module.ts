import { Module } from '@nestjs/common';
import { VolunteerService } from './volunteer.service.js';
import { VolunteerController } from './volunteer.controller.js';

@Module({
  controllers: [VolunteerController],
  providers: [VolunteerService],
})
export class VolunteerModule {}
