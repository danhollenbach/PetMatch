import { PartialType } from '@nestjs/mapped-types';
import { CreateAdoptionFairDto } from './create-adoption_fair.dto.js';

export class UpdateAdoptionFairDto extends PartialType(CreateAdoptionFairDto) {}
