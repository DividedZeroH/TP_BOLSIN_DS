import { EstadoRegistro } from './estado.registro';
import { DetalleRemitoRegistro } from './detalle-remito.registro';

/** Estructura plana de un Remito con sus detalles de documentación. */
export interface RemitoRegistro {
  id: number;
  Numero: number;
  estado: EstadoRegistro;
  detalles: DetalleRemitoRegistro[];
}
