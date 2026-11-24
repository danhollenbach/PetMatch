import { PartialType } from '@nestjs/mapped-types';
import { CreateAdoptantDto } from './create-adoptant.dto.js';

export class UpdateAdoptantDto extends PartialType(CreateAdoptantDto) {}
