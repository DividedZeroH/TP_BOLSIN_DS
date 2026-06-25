import { OpcionRecepcion } from './recepcion-bolsin.modelos';

/**
 * Descriptor de un manejador de opción de recepción. `implementado en false`
 * preserva el rechazo explícito (BadRequestException) que hoy tienen las
 * opciones cuyo flujo alternativo no forma parte de esta entrega.
 */
export interface ManejadorOpcionRecepcion {
  readonly opcion: OpcionRecepcion;
  readonly implementado: boolean;
}
