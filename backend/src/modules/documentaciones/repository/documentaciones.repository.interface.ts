import { Documentacion } from '../entity/documentacion.entity';

import { ContextoTransaccion } from '../../../shared/transaction/unidad-de-trabajo.interface';
export const DOCUMENTACIONES_REPOSITORY = Symbol('DOCUMENTACIONES_REPOSITORY');
export interface DocumentacionesRepositoryInterface {
  guardarCambiosEstado(
    documentaciones: Documentacion[],
    contexto: ContextoTransaccion,
  ): Promise<void>;
}
