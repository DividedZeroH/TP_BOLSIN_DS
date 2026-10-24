import { INestApplication, ValidationPipe } from '@nestjs/common';

/** Configuración HTTP compartida por `main.ts` y los tests e2e. */
export function configurarApp(app: INestApplication): INestApplication {
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  // Angular se ejecuta en otro puerto durante el desarrollo.
  app.enableCors({ origin: 'http://localhost:4200' });
  return app;
}
