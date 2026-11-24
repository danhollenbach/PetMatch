import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AnimalsModule } from './animals/animals.module.js';
import { AdoptionModule } from './adoption/adoption.module.js';
import { AdoptantModule } from './adoptant/adoptant.module.js';
import { MedicalRecordModule } from './medical_record/medical_record.module.js';
import { VaccineModule } from './vaccine/vaccine.module.js';
import { ServiceModule } from './service/service.module.js';
import { VeterinarianModule } from './veterinarian/veterinarian.module.js';
import { ShelterModule } from './shelter/shelter.module.js';
import { DonationModule } from './donation/donation.module.js';
import { DonorModule } from './donor/donor.module.js';
import { VolunteerModule } from './volunteer/volunteer.module.js';
import { AdoptionFairModule } from './adoption_fair/adoption_fair.module.js';

@Module({
  imports: [AnimalsModule, AdoptionModule, AdoptantModule, MedicalRecordModule, VaccineModule, ServiceModule, VeterinarianModule, ShelterModule, DonationModule, DonorModule, VolunteerModule, AdoptionFairModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
