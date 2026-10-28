import { Injectable } from '@nestjs/common';
import { ContextoPersistencia } from '../../../database/transaction/contexto-persistencia';
import { ContextoTransaccion } from '../../../shared/transaction/unidad-de-trabajo.interface';
import { Estado, AmbitoEstado } from '../entity/estado.entity';
import { EstadosRepositoryInterface } from './estados.repository.interface';

@Injectable()
export class EstadosRepository implements EstadosRepositoryInterface {
  constructor(private readonly persistencia: ContextoPersistencia) {}
  buscarPorNombreYAmbito(
    nombre: string,
    ambito: AmbitoEstado,
    contexto?: ContextoTransaccion,
  ): Promise<Estado | null> {
    return this.persistencia
      .obtenerManager(contexto)
      .findOneBy(Estado, { nombre, ambito });
  }
}
