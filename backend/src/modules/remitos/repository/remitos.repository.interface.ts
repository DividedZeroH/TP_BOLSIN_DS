import { Remito } from '../entity/remito.entity';

import { ContextoTransaccion } from '../../../shared/transaction/unidad-de-trabajo.interface';
export const REMITOS_REPOSITORY = Symbol('REMITOS_REPOSITORY');
export interface RemitosRepositoryInterface {
  guardarEstados(remitos: Remito[], contexto: ContextoTransaccion): Promise<void>;
}
