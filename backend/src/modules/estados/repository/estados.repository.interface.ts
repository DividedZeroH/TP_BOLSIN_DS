import { Estado } from '../entity/estado.entity';
import { ContextoTransaccion } from '../../../shared/transaction/unidad-de-trabajo.interface';

export const ESTADOS_REPOSITORY = Symbol('ESTADOS_REPOSITORY');
export interface EstadosRepositoryInterface {
  buscarTodos(contexto?: ContextoTransaccion): Promise<Estado[]>;
}
