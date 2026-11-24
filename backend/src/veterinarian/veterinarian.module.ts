import { Module } from '@nestjs/common';
import { VeterinarianService } from './veterinarian.service.js';
import { VeterinarianController } from './veterinarian.controller.js';

@Module({
  controllers: [VeterinarianController],
  providers: [VeterinarianService],
})
export class VeterinarianModule {}
