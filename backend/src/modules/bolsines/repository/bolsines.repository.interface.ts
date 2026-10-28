import { Bolsin } from '../entity/bolsin.entity';

import { ContextoTransaccion } from '../../../shared/transaction/unidad-de-trabajo.interface';
export const BOLSINES_REPOSITORY = Symbol('BOLSINES_REPOSITORY');
export interface BolsinesRepositoryInterface {
  buscarPorDestino(comisionId: number): Promise<Bolsin[]>;
  buscarParaActualizar(
    numeroPrecinto: number,
    contexto: ContextoTransaccion,
  ): Promise<Bolsin | null>;
  guardarCambiosEstado(bolsin: Bolsin, contexto: ContextoTransaccion): Promise<void>;
}
