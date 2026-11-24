import { PartialType } from '@nestjs/mapped-types';
import { CreateAdoptionDto } from './create-adoption.dto.js';

export class UpdateAdoptionDto extends PartialType(CreateAdoptionDto) {}
