import { PartialType } from '@nestjs/mapped-types';
import { CreateVolunteerDto } from './create-volunteer.dto.js';

export class UpdateVolunteerDto extends PartialType(CreateVolunteerDto) {}
