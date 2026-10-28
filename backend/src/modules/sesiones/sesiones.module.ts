import { EmpleadosModule } from '../empleados/empleados.module';
import { ComisionesMedicasModule } from '../comisiones-medicas/comisiones-medicas.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sesion } from './entity/sesion.entity';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { SesionService } from './service/sesion.service';
import { SESIONES_REPOSITORY } from './repository/sesiones.repository.interface';
import { SesionesRepository } from './repository/sesiones.repository';
import { SesionController } from './controller/sesion.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sesion]),
    UsuariosModule,
    EmpleadosModule,
    ComisionesMedicasModule,
  ],
  controllers: [SesionController],
  providers: [
    SesionService,
    { provide: SESIONES_REPOSITORY, useClass: SesionesRepository },
  ],
  exports: [SesionService],
})
export class SesionesModule {}
