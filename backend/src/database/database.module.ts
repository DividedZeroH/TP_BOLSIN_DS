import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { opcionesBaseDeDatos } from './configuracion';
import { UNIDAD_DE_TRABAJO } from '../shared/transaction/unidad-de-trabajo.interface';
import { ContextoPersistencia } from './transaction/contexto-persistencia';
import { TypeOrmUnidadDeTrabajo } from './transaction/typeorm-unidad-de-trabajo';

/**
 * Conexión única a Postgres. Las entidades las registra cada módulo con
 * `TypeOrmModule.forFeature` (`autoLoadEntities`), así que acá no se listan.
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        ...opcionesBaseDeDatos(),
        entities: [],
        migrations: [],
        autoLoadEntities: true,
      }),
    }),
  ],
  providers: [
    ContextoPersistencia,
    { provide: UNIDAD_DE_TRABAJO, useClass: TypeOrmUnidadDeTrabajo },
  ],
  exports: [ContextoPersistencia, UNIDAD_DE_TRABAJO],
})
export class DatabaseModule {}
