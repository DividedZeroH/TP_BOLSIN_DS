import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Módulo global que provee y exporta el `PrismaService`, de modo que cualquier
 * repositorio pueda inyectarlo sin reimportar este módulo en cada feature.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
