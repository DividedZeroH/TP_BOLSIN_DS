import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  // Angular se ejecuta en otro puerto durante el desarrollo.
  app.enableCors({ origin: 'http://localhost:4200' });
  await app.listen(Number(process.env.PORT ?? 3000));
}

void bootstrap();
