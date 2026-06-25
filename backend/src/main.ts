import { config } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// .env guarda secretos (DATABASE_URL) y no se versiona; .env.ports guarda
// solo el puerto, no es sensible y sí se versiona.
config();
config({ path: '.env.ports' });

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  // Angular se ejecuta en otro puerto durante el desarrollo.
  app.enableCors({ origin: 'http://localhost:4200' });
  await app.listen(Number(process.env.PORT ?? 3000));
}

void bootstrap();
