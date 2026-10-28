import { Injectable } from '@nestjs/common';
import { ContextoPersistencia } from '../../../database/transaction/contexto-persistencia';
import { Empleado } from '../entity/empleado.entity';
import { EmpleadosRepositoryInterface } from './empleados.repository.interface';

@Injectable()
export class EmpleadosRepository implements EmpleadosRepositoryInterface {
  constructor(private readonly persistencia: ContextoPersistencia) {}

  buscarPorId(id: number): Promise<Empleado | null> {
    return this.persistencia.obtenerManager().findOneBy(Empleado, { id });
  }
}
