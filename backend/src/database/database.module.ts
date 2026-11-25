import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { DatabaseController } from './database.controller.js';
import { DatabaseService } from './database.service.js';

@Module({
  providers: [
    {
      provide: Pool,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const pool = new Pool({
          host: config.getOrThrow<string>('POSTGRES_HOST'),
          port: config.getOrThrow<number>('POSTGRES_PORT'),
          database: config.getOrThrow<string>('POSTGRES_DB'),
          user: config.getOrThrow<string>('POSTGRES_USER'),
          password: config.getOrThrow<string>('POSTGRES_PASSWORD'),
          max: 10,
          connectionTimeoutMillis: 5000,
          idleTimeoutMillis: 30000,
          statement_timeout: 5000,
          application_name: 'petmatch-backend',
        });
        const logger = new Logger(DatabaseModule.name);
        // O pg remove conexões ociosas que falham; o listener evita erro não tratado.
        pool.on('error', () => {
          logger.error('Uma conexão ociosa com o PostgreSQL foi interrompida.');
        });
        return pool;
      },
    },
    DatabaseService,
  ],
  controllers: [DatabaseController],
  exports: [DatabaseService],
})
export class DatabaseModule {}
