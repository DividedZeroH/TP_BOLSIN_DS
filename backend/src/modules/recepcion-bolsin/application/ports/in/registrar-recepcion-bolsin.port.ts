import {
  DetalleBolsinRecepcion,
  InicioRecepcionBolsin,
  OpcionRecepcion,
  ResultadoRecepcionBolsin,
} from '../../dto/recepcion-bolsin.modelos';

/** Token de inyección del puerto de entrada del CU28. */
export const REGISTRAR_RECEPCION_BOLSIN = 'REGISTRAR_RECEPCION_BOLSIN';

/**
 * Puerto de entrada (driving port) del caso de uso "Registrar recepción de
 * bolsín".
 *
 * Es el contrato que la aplicación ofrece hacia afuera: cualquier adaptador de
 * entrada (el controlador HTTP hoy, un CLI o una cola mañana) depende de esta
 * interfaz y no de `GestorRegistrarRecepcionBolsin`. Los mensajes son los del
 * diagrama de secuencia.
 */
export interface IRegistrarRecepcionBolsin {
  nuevaRecepcionBolsin(sesionId: number): Promise<InicioRecepcionBolsin>;

  tomarBolsin(sesionId: number, bolsinId: number): Promise<DetalleBolsinRecepcion>;

  tomarOpcion(opcion: OpcionRecepcion): OpcionRecepcion;

  tomarConfirmacion(
    sesionId: number,
    bolsinId: number,
    confirmacion: boolean,
  ): Promise<ResultadoRecepcionBolsin>;
}
