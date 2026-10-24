import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { opcionesBaseDeDatos } from './configuracion';

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
})
export class DatabaseModule {}
