import { Module } from '@nestjs/common';
import { CatalogoModule, EstadoMapper } from '../catalogo';
import { IdentidadModule, ISesionRepository, SESION_REPOSITORY } from '../identidad';
import { PrismaModule } from '../../platform/persistence/prisma/prisma.module';
import { PrismaService } from '../../platform/persistence/prisma/prisma.service';
import { REGISTRAR_RECEPCION_BOLSIN } from './application/ports/in/registrar-recepcion-bolsin.port';
import { BOLSIN_REPOSITORY, IBolsinRepository } from './application/ports/out/bolsin.repository';
import {
  INotificadorRecepcion,
  NOTIFICADOR_RECEPCION,
} from './application/ports/out/notificador-recepcion';
import {
  IUnidadDeTrabajo,
  UNIDAD_DE_TRABAJO,
} from './application/ports/out/unidad-de-trabajo';
import { GestorRegistrarRecepcionBolsin } from './application/services/gestor-registrar-recepcion-bolsin.service';
import { ErroresRecepcionBolsinFilter } from './infrastructure/http/errores-recepcion-bolsin.filter';
import { RecepcionBolsinController } from './infrastructure/http/recepcion-bolsin.controller';
import { NotificadorCU29Log } from './infrastructure/notificaciones/notificador-cu29.adapter';
import { BolsinMapper } from './infrastructure/persistence/bolsin.mapper';
import { PrismaBolsinRepository } from './infrastructure/persistence/prisma-bolsin.repository';
import { PrismaUnidadDeTrabajo } from './infrastructure/persistence/prisma-unidad-de-trabajo';

/**
 * Composition root del subdominio "recepción de bolsín" (CU28): el único lugar
 * que conoce a la vez la aplicación y la infraestructura, y donde se enchufan
 * los adaptadores a los puertos.
 *
 * Depende de los subdominios de soporte (Catálogo e Identidad) a través de sus
 * módulos públicos, nunca de sus internals.
 *
 * El gestor se construye por fábrica porque es una clase sin decoradores: la
 * capa de aplicación no depende de NestJS.
 */
@Module({
  imports: [PrismaModule, CatalogoModule, IdentidadModule],
  controllers: [RecepcionBolsinController],
  providers: [
    BolsinMapper,
    ErroresRecepcionBolsinFilter,
    { provide: NOTIFICADOR_RECEPCION, useClass: NotificadorCU29Log },
    {
      provide: BOLSIN_REPOSITORY,
      useFactory: (prisma: PrismaService, mapper: BolsinMapper) =>
        new PrismaBolsinRepository(prisma, mapper),
      inject: [PrismaService, BolsinMapper],
    },
    {
      provide: UNIDAD_DE_TRABAJO,
      useFactory: (
        prisma: PrismaService,
        bolsinMapper: BolsinMapper,
        estadoMapper: EstadoMapper,
      ) => new PrismaUnidadDeTrabajo(prisma, bolsinMapper, estadoMapper),
      inject: [PrismaService, BolsinMapper, EstadoMapper],
    },
    {
      provide: GestorRegistrarRecepcionBolsin,
      useFactory: (
        bolsines: IBolsinRepository,
        sesiones: ISesionRepository,
        unidadDeTrabajo: IUnidadDeTrabajo,
        notificador: INotificadorRecepcion,
      ) =>
        new GestorRegistrarRecepcionBolsin(
          bolsines,
          sesiones,
          unidadDeTrabajo,
          notificador,
        ),
      inject: [
        BOLSIN_REPOSITORY,
        SESION_REPOSITORY,
        UNIDAD_DE_TRABAJO,
        NOTIFICADOR_RECEPCION,
      ],
    },
    // El adaptador de entrada depende del puerto; `useExisting` evita crear
    // una segunda instancia del gestor.
    {
      provide: REGISTRAR_RECEPCION_BOLSIN,
      useExisting: GestorRegistrarRecepcionBolsin,
    },
  ],
})
export class RecepcionBolsinModule {}
