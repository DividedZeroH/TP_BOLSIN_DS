import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configurarApp } from './configurar-app';

async function bootstrap(): Promise<void> {
  const app = configurarApp(await NestFactory.create(AppModule));
  await app.listen(Number(process.env.PORT ?? 3000));
}

void bootstrap();
