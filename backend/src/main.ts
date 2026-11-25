import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  try {
    await app.listen(app.get(ConfigService).getOrThrow<number>('PORT'));
  } catch (error) {
    await app.close();
    throw error;
  }
}
await bootstrap();
