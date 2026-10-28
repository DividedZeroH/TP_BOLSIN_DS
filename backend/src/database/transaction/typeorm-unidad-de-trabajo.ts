import { Injectable } from '@nestjs/common';
import {
  ContextoTransaccion,
  UnidadDeTrabajo,
} from '../../shared/transaction/unidad-de-trabajo.interface';
import { ContextoPersistencia } from './contexto-persistencia';

@Injectable()
export class TypeOrmUnidadDeTrabajo implements UnidadDeTrabajo {
  constructor(private readonly persistencia: ContextoPersistencia) {}

  ejecutar<T>(operacion: (contexto: ContextoTransaccion) => Promise<T>): Promise<T> {
    return this.persistencia.enTransaccion(operacion);
  }
}
