import { Estado } from '../entity/estado.entity';
import { AmbitoEstado } from '../entity/estado.entity';
import { ContextoTransaccion } from '../../../shared/transaction/unidad-de-trabajo.interface';
export const ESTADOS_REPOSITORY = Symbol('ESTADOS_REPOSITORY');
export interface EstadosRepositoryInterface {
  buscarPorNombreYAmbito(
    nombre: string,
    ambito: AmbitoEstado,
    contexto?: ContextoTransaccion,
  ): Promise<Estado | null>;
}
