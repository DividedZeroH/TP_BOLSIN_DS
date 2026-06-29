import {
  OPCION_CONTENIDO_IGUAL,
  OpcionRecepcion,
} from '../recepcion-bolsin.modelos';
import { ManejadorOpcionRecepcion } from './manejador-opcion-recepcion';

/**
 * Tabla de manejadores por código de opción (OCP): agregar el soporte de una
 * nueva opción del flujo alternativo significa registrar una entrada nueva
 * en este mapa, no modificar un `if/else` existente en el servicio.
 */
export const MANEJADORES_OPCION_RECEPCION: Readonly<
  Record<OpcionRecepcion, ManejadorOpcionRecepcion>
> = {
  [OPCION_CONTENIDO_IGUAL]: {
    opcion: OPCION_CONTENIDO_IGUAL,
    implementado: true,
  },
  FALTA_DOCUMENTACION: {
    opcion: 'FALTA_DOCUMENTACION',
    implementado: false,
  },
  DOCUMENTACION_NO_CORRESPONDE: {
    opcion: 'DOCUMENTACION_NO_CORRESPONDE',
    implementado: false,
  },
  REDIRIGIR_OTRA_AREA: {
    opcion: 'REDIRIGIR_OTRA_AREA',
    implementado: false,
  },
};
