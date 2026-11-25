import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'node:path';
import { validateEnvironment } from './config/environment.js';
import { DatabaseModule } from './database/database.module.js';
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
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        resolve(process.cwd(), '.env'),
        resolve(process.cwd(), '../.env'),
      ],
      validate: validateEnvironment,
    }),
    DatabaseModule,
    AnimalsModule,
    AdoptionModule,
    AdoptantModule,
    MedicalRecordModule,
    VaccineModule,
    ServiceModule,
    VeterinarianModule,
    ShelterModule,
    DonationModule,
    DonorModule,
    VolunteerModule,
    AdoptionFairModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
