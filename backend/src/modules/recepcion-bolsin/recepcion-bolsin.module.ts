import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogoModule } from '../catalogo/catalogo.module';
import { IdentidadModule } from '../identidad/identidad.module';
import { GestorRegistrarRecepcionBolsin } from './gestor-registrar-recepcion-bolsin.service';
import { NotificadorCU29Service } from './notificador-cu29.service';
import { BolsinOrmEntity } from './persistence/bolsin.orm-entity';
import { CambioEstadoBolsinOrmEntity } from './persistence/cambio-estado-bolsin.orm-entity';
import { CambioEstadoDocumentacionOrmEntity } from './persistence/cambio-estado-documentacion.orm-entity';
import { DetalleRemitoOrmEntity } from './persistence/detalle-remito.orm-entity';
import { DocumentacionOrmEntity } from './persistence/documentacion.orm-entity';
import { RemitoOrmEntity } from './persistence/remito.orm-entity';
import { TipoDocumentacionOrmEntity } from './persistence/tipo-documentacion.orm-entity';
import { RecepcionEnCursoStore } from './recepcion-en-curso.store';

/** CU28 — Registrar recepción de bolsín. */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      BolsinOrmEntity,
      RemitoOrmEntity,
      DetalleRemitoOrmEntity,
      DocumentacionOrmEntity,
      TipoDocumentacionOrmEntity,
      CambioEstadoBolsinOrmEntity,
      CambioEstadoDocumentacionOrmEntity,
    ]),
    IdentidadModule,
    CatalogoModule,
  ],
  providers: [GestorRegistrarRecepcionBolsin, RecepcionEnCursoStore, NotificadorCU29Service],
})
export class RecepcionBolsinModule {}
