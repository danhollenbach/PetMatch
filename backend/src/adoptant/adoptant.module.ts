import { Module } from '@nestjs/common';
import { AdoptantService } from './adoptant.service.js';
import { AdoptantController } from './adoptant.controller.js';

@Module({
  controllers: [AdoptantController],
  providers: [AdoptantService],
})
export class AdoptantModule {}
