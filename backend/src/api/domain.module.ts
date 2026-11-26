import { PhotoController } from './photo.controller.js';
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { DomainController } from './domain.controller.js';
import { DomainService } from './domain.service.js';
import { DomainRepository } from './repository.js';
import { QueryRunner } from './query-runner.js';

@Module({
  imports: [DatabaseModule],
  controllers: [DomainController, PhotoController],
  providers: [DomainService, DomainRepository, QueryRunner],
})
export class DomainModule {}
