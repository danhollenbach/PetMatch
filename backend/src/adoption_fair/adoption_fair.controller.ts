import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AdoptionFairService } from './adoption_fair.service.js';
import { CreateAdoptionFairDto } from './dto/create-adoption_fair.dto.js';
import { UpdateAdoptionFairDto } from './dto/update-adoption_fair.dto.js';

@Controller('adoption-fair')
export class AdoptionFairController {
  constructor(private readonly adoptionFairService: AdoptionFairService) {}

  @Post()
  create(@Body() createAdoptionFairDto: CreateAdoptionFairDto) {
    return this.adoptionFairService.create(createAdoptionFairDto);
  }

  @Get()
  findAll() {
    return this.adoptionFairService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adoptionFairService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAdoptionFairDto: UpdateAdoptionFairDto) {
    return this.adoptionFairService.update(+id, updateAdoptionFairDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adoptionFairService.remove(+id);
  }
}
