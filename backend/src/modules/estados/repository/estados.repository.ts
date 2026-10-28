import { Injectable } from '@nestjs/common';
import { ContextoPersistencia } from '../../../database/transaction/contexto-persistencia';
import { ContextoTransaccion } from '../../../shared/transaction/unidad-de-trabajo.interface';
import { Estado } from '../entity/estado.entity';
import { EstadosRepositoryInterface } from './estados.repository.interface';

@Injectable()
export class EstadosRepository implements EstadosRepositoryInterface {
  constructor(private readonly persistencia: ContextoPersistencia) {}
  buscarTodos(contexto?: ContextoTransaccion): Promise<Estado[]> {
    return this.persistencia.obtenerManager(contexto).find(Estado);
  }
}
