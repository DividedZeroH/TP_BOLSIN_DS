import { Module } from '@nestjs/common';
import { GestorRegistrarRecepcionBolsin } from './control/gestor-registrar-recepcion-bolsin';
import { RecepcionBolsinController } from './control/recepcion-bolsin.controller';
import { RecepcionBolsinPresenter } from './control/recepcion-bolsin.presenter';
import { RecepcionBolsinServicio } from './servicio/recepcion-bolsin.servicio';
import { BolsinMapper } from './servicio/bolsin.mapper';
import { BOLSIN_REPOSITORY } from './repositorio/bolsin.repository';
import { PrismaBolsinRepository } from './repositorio/prisma-bolsin.repository';
import { ESTADO_REPOSITORY } from './repositorio/estado.repository';
import { PrismaEstadoRepository } from './repositorio/prisma-estado.repository';
import { SESION_REPOSITORY } from './repositorio/sesion.repository';
import { PrismaSesionRepository } from './repositorio/prisma-sesion.repository';

@Module({
  controllers: [RecepcionBolsinController],
  providers: [
    GestorRegistrarRecepcionBolsin,
    RecepcionBolsinServicio,
    RecepcionBolsinPresenter,
    BolsinMapper,
    { provide: BOLSIN_REPOSITORY, useClass: PrismaBolsinRepository },
    { provide: ESTADO_REPOSITORY, useClass: PrismaEstadoRepository },
    { provide: SESION_REPOSITORY, useClass: PrismaSesionRepository },
  ],
})
export class RecepcionBolsinModule {}
