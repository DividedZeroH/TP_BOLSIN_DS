import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Deliberadamente NO es `@Global()`: en un monolito modular los límites entre
 * módulos se declaran, no se perforan. Quien necesite `PrismaService` importa
 * `SharedModule`, que reexporta este módulo.
 */
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
