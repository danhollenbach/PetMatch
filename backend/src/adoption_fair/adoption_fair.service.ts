import { Injectable } from '@nestjs/common';
import { CreateAdoptionFairDto } from './dto/create-adoption_fair.dto.js';
import { UpdateAdoptionFairDto } from './dto/update-adoption_fair.dto.js';

@Injectable()
export class AdoptionFairService {
  create(createAdoptionFairDto: CreateAdoptionFairDto) {
    return 'This action adds a new adoptionFair';
  }

  findAll() {
    return `This action returns all adoptionFair`;
  }

  findOne(id: number) {
    return `This action returns a #${id} adoptionFair`;
  }

  update(id: number, updateAdoptionFairDto: UpdateAdoptionFairDto) {
    return `This action updates a #${id} adoptionFair`;
  }

  remove(id: number) {
    return `This action removes a #${id} adoptionFair`;
  }
}
