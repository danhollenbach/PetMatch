import { PartialType } from '@nestjs/mapped-types';
import { CreateShelterDto } from './create-shelter.dto.js';

export class UpdateShelterDto extends PartialType(CreateShelterDto) {}
