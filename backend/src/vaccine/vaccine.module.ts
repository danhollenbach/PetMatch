import { Module } from '@nestjs/common';
import { VaccineService } from './vaccine.service.js';
import { VaccineController } from './vaccine.controller.js';

@Module({
  controllers: [VaccineController],
  providers: [VaccineService],
})
export class VaccineModule {}
