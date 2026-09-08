import { Module } from '@nestjs/common';
import { PrismaModule } from '../../platform/persistence/prisma/prisma.module';
import { PrismaService } from '../../platform/persistence/prisma/prisma.service';
import { ESTADO_REPOSITORY } from './application/ports/estado.repository';
import { EstadoMapper } from './infrastructure/persistence/prisma/estado.mapper';
import { PrismaEstadoRepository } from './infrastructure/persistence/prisma/prisma-estado.repository';

/**
 * Subdominio de soporte: el catálogo de estados (`Estado`) que comparten
 * Bolsin, Remito y Documentacion, con sus predicados `sos...()`.
 */
@Module({
  imports: [PrismaModule],
  providers: [
    EstadoMapper,
    {
      provide: ESTADO_REPOSITORY,
      useFactory: (prisma: PrismaService, mapper: EstadoMapper) =>
        new PrismaEstadoRepository(prisma, mapper),
      inject: [PrismaService, EstadoMapper],
    },
  ],
  exports: [ESTADO_REPOSITORY, EstadoMapper],
})
export class CatalogoModule {}
