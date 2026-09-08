import { OpcionRecepcion } from '../dto/recepcion-bolsin.modelos';

/**
 * Descriptor de una opción de recepción: por ahora son datos, no una
 * estrategia con comportamiento (ver la nota en `opcion-recepcion.handlers.ts`).
 * `implementado: false` es lo que hace que `tomarOpcion()` rechace de forma
 * explícita las opciones cuyo flujo alternativo no forma parte de esta entrega.
 */
export interface ManejadorOpcionRecepcion {
  readonly opcion: OpcionRecepcion;
  /** Texto que la pantalla ofrece al usuario para esta situación. */
  readonly descripcion: string;
  readonly implementado: boolean;
}
