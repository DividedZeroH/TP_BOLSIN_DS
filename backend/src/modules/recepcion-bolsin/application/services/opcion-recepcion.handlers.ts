import {
  OPCION_CONTENIDO_IGUAL,
  OpcionRecepcion,
} from '../dto/recepcion-bolsin.modelos';
import { ManejadorOpcionRecepcion } from './manejador-opcion-recepcion';

/**
 * Catálogo de situaciones de recepción por código.
 *
 * Es la única fuente de verdad de qué situaciones existen y cuáles están
 * implementadas: la pantalla las recibe desde acá (vía `tomarBolsin`) en lugar
 * de mantener su propia lista, para que la UI no pueda ofrecer como válida una
 * opción que el gestor va a rechazar.
 *
 * OJO — esto todavía NO es Strategy, aunque las entradas se llamen
 * "manejadores": `ManejadorOpcionRecepcion` solo tiene datos y ningún
 * comportamiento, y `tomarConfirmacion()` tiene un único flujo fijo. Hoy sirve
 * para *describir* las opciones y rechazar las no implementadas, no para
 * despacharlas polimórficamente. Cuando se implementen los flujos alternativos
 * A1–A6, cada entrada debería ganar su propio `ejecutar(...)` y el gestor
 * delegar en él; si no, va a terminar apareciendo el `if/else` que esta tabla
 * pretende evitar.
 */
export const MANEJADORES_OPCION_RECEPCION: Readonly<
  Record<OpcionRecepcion, ManejadorOpcionRecepcion>
> = {
  [OPCION_CONTENIDO_IGUAL]: {
    opcion: OPCION_CONTENIDO_IGUAL,
    descripcion: 'El contenido del bolsín es igual al registrado.',
    implementado: true,
  },
  FALTA_DOCUMENTACION: {
    opcion: 'FALTA_DOCUMENTACION',
    descripcion:
      'No se recibe toda la documentación asociada a los remitos que contiene el bolsín.',
    implementado: false,
  },
  DOCUMENTACION_NO_CORRESPONDE: {
    opcion: 'DOCUMENTACION_NO_CORRESPONDE',
    descripcion:
      'Existe documentación que no corresponde al destino (CM del usuario logueado).',
    implementado: false,
  },
  REDIRIGIR_OTRA_AREA: {
    opcion: 'REDIRIGIR_OTRA_AREA',
    descripcion: 'La documentación se debe redirigir a otra área.',
    implementado: false,
  },
};
