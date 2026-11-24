import { Injectable } from '@nestjs/common';
import { CreateAdoptantDto } from './dto/create-adoptant.dto.js';
import { UpdateAdoptantDto } from './dto/update-adoptant.dto.js';

@Injectable()
export class AdoptantService {
  create(createAdoptantDto: CreateAdoptantDto) {
    return 'This action adds a new adoptant';
  }

  findAll() {
    return `This action returns all adoptant`;
  }

  findOne(id: number) {
    return `This action returns a #${id} adoptant`;
  }

  update(id: number, updateAdoptantDto: UpdateAdoptantDto) {
    return `This action updates a #${id} adoptant`;
  }

  remove(id: number) {
    return `This action removes a #${id} adoptant`;
  }
}
