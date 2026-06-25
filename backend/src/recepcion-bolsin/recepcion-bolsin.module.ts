import { Module } from '@nestjs/common';
import { GestorRegistrarRecepcionBolsin } from './gestor-registrar-recepcion-bolsin.service';
import { RecepcionBolsinController } from './recepcion-bolsin.controller';
import { BolsinMapper } from './bolsin.mapper';
import { SESION_REPOSITORY } from './repositorios/sesion.repository';
import { PrismaSesionRepository } from './repositorios/prisma-sesion.repository';
import { BOLSIN_REPOSITORY } from './repositorios/bolsin.repository';
import { PrismaBolsinRepository } from './repositorios/prisma-bolsin.repository';
import { ESTADO_REPOSITORY } from './repositorios/estado.repository';
import { PrismaEstadoRepository } from './repositorios/prisma-estado.repository';

/**
 * PrismaService se inyecta vía PrismaModule (@Global), por lo que no es
 * necesario volver a declararlo aquí; las implementaciones Prisma*Repository
 * lo reciben por constructor como cualquier otro provider de Nest.
 */
@Module({
  controllers: [RecepcionBolsinController],
  providers: [
    GestorRegistrarRecepcionBolsin,
    BolsinMapper,
    { provide: SESION_REPOSITORY, useClass: PrismaSesionRepository },
    { provide: BOLSIN_REPOSITORY, useClass: PrismaBolsinRepository },
    { provide: ESTADO_REPOSITORY, useClass: PrismaEstadoRepository },
  ],
})
export class RecepcionBolsinModule {}
