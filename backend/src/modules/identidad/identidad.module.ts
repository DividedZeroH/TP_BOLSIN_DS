import { Module } from '@nestjs/common';
import { PrismaModule } from '../../platform/persistence/prisma/prisma.module';
import { PrismaService } from '../../platform/persistence/prisma/prisma.service';
import { SESION_REPOSITORY } from './application/ports/sesion.repository';
import { IdentidadMapper } from './infrastructure/persistence/prisma/identidad.mapper';
import { PrismaSesionRepository } from './infrastructure/persistence/prisma/prisma-sesion.repository';

/**
 * Subdominio de soporte: quién está logueado. Resuelve la navegación
 * `Sesion -> Usuario -> Empleado` que el CU28 necesita para saber a qué
 * comisión médica pertenece el usuario.
 */
@Module({
  imports: [PrismaModule],
  providers: [
    IdentidadMapper,
    {
      provide: SESION_REPOSITORY,
      useFactory: (prisma: PrismaService, mapper: IdentidadMapper) =>
        new PrismaSesionRepository(prisma, mapper),
      inject: [PrismaService, IdentidadMapper],
    },
  ],
  exports: [SESION_REPOSITORY],
})
export class IdentidadModule {}
