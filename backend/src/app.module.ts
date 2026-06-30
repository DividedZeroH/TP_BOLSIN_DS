import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { RecepcionBolsinModule } from './recepcion-bolsin/recepcion-bolsin.module';

/**
 * Módulo raíz de la aplicación NestJS. Compone el acceso a datos
 * (`PrismaModule`, global) con el módulo del caso de uso de recepción de
 * bolsín (`RecepcionBolsinModule`).
 */
@Module({
  imports: [PrismaModule, RecepcionBolsinModule],
})
export class AppModule {}
