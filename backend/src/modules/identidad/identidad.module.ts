import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComisionMedicaOrmEntity } from '../organizacion/persistence/comision-medica.orm-entity';
import { EmpleadoOrmEntity } from './persistence/empleado.orm-entity';
import { SesionOrmEntity } from './persistence/sesion.orm-entity';
import { UsuarioOrmEntity } from './persistence/usuario.orm-entity';
import { SesionController } from './sesion.controller';
import { SesionService } from './sesion.service';

/**
 * Quién está logueado: resuelve Sesion -> Usuario -> Empleado -> ComisionMedica.
 * Organización no tiene módulo propio (solo entidad), así que su tabla se
 * registra acá.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      SesionOrmEntity,
      UsuarioOrmEntity,
      EmpleadoOrmEntity,
      ComisionMedicaOrmEntity,
    ]),
  ],
  controllers: [SesionController],
  providers: [SesionService],
  exports: [SesionService],
})
export class IdentidadModule {}
