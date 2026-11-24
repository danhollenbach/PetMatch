import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AdoptantService } from './adoptant.service.js';
import { CreateAdoptantDto } from './dto/create-adoptant.dto.js';
import { UpdateAdoptantDto } from './dto/update-adoptant.dto.js';

@Controller('adoptant')
export class AdoptantController {
  constructor(private readonly adoptantService: AdoptantService) {}

  @Post()
  create(@Body() createAdoptantDto: CreateAdoptantDto) {
    return this.adoptantService.create(createAdoptantDto);
  }

  @Get()
  findAll() {
    return this.adoptantService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adoptantService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAdoptantDto: UpdateAdoptantDto) {
    return this.adoptantService.update(+id, updateAdoptantDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adoptantService.remove(+id);
  }
}
