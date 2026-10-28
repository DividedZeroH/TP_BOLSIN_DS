import { Injectable } from '@nestjs/common';
import { ContextoPersistencia } from '../../../database/transaction/contexto-persistencia';
import { Sesion } from '../entity/sesion.entity';
import { SesionesRepositoryInterface } from './sesiones.repository.interface';

@Injectable()
export class SesionesRepository implements SesionesRepositoryInterface {
  constructor(private readonly persistencia: ContextoPersistencia) {}

  buscarPorId(id: number): Promise<Sesion | null> {
    return this.persistencia.obtenerManager().findOneBy(Sesion, { id });
  }
}
