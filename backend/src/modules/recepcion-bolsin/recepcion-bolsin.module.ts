import { Module } from '@nestjs/common';
import { GestorRegistrarRecepcionBolsin } from './gestor-registrar-recepcion-bolsin.service';
import { RecepcionBolsinController } from './recepcion-bolsin.controller';
import { BolsinMapper } from './bolsin.mapper';
import { BOLSIN_REPOSITORY } from './repositorios/bolsin.repository';
import { PrismaBolsinRepository } from './repositorios/prisma-bolsin.repository';
import { ESTADO_REPOSITORY } from './repositorios/estado.repository';
import { PrismaEstadoRepository } from './repositorios/prisma-estado.repository';
import { SESION_REPOSITORY } from './repositorios/sesion.repository';
import { PrismaSesionRepository } from './repositorios/prisma-sesion.repository';

@Module({
  controllers: [RecepcionBolsinController],
  providers: [
    GestorRegistrarRecepcionBolsin,
    BolsinMapper,
    { provide: BOLSIN_REPOSITORY, useClass: PrismaBolsinRepository },
    { provide: ESTADO_REPOSITORY, useClass: PrismaEstadoRepository },
    { provide: SESION_REPOSITORY, useClass: PrismaSesionRepository },
  ],
})
export class RecepcionBolsinModule {}
