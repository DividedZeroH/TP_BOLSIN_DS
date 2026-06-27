import { EstadoRegistro } from './estado.registro';
import { EmpleadoConComisionRegistro } from './empleado-con-comision.registro';

/** Fila plana de un cambio de estado (de Bolsin o de Documentacion). */
export interface CambioEstadoRegistro {
  id: number;
  fechaHoraInicio: Date;
  fechaHoraFin: Date | null;
  estado: EstadoRegistro;
  empleado: EmpleadoConComisionRegistro;
}
