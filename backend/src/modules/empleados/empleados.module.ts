import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Empleado } from './entity/empleado.entity';
import { ComisionesMedicasModule } from '../comisiones-medicas/comisiones-medicas.module';
import { EmpleadosService } from './service/empleados.service';
import { EMPLEADOS_REPOSITORY } from './repository/empleados.repository.interface';
import { EmpleadosRepository } from './repository/empleados.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Empleado]), ComisionesMedicasModule],

  providers: [
    EmpleadosService,
    { provide: EMPLEADOS_REPOSITORY, useClass: EmpleadosRepository },
  ],
  exports: [EmpleadosService],
})
export class EmpleadosModule {}
