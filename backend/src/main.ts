import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

/**
 * Punto de entrada del backend. Crea la app NestJS, expone la API bajo el
 * prefijo `/api`, habilita CORS para el frontend Angular (que corre en otro
 * puerto en desarrollo) y la deja escuchando en el puerto configurado.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  // Angular se ejecuta en otro puerto durante el desarrollo.
  app.enableCors({ origin: 'http://localhost:4200' });
  await app.listen(Number(process.env.PORT ?? 3000));
}

void bootstrap();
