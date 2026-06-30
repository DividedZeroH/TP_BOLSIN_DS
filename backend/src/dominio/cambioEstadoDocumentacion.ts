import { Empleado } from './empleado';
import { Estado } from './estado';

/**
 * Entidad CambioEstadoDocumentacion del modelo: una entrada del historial de
 * estados de una Documentacion. `fechaHoraFin` en null marca el cambio vigente;
 * al cerrarlo se completa la fecha y se abre uno nuevo. `id` es null mientras
 * el cambio existe solo en memoria, antes de persistirse.
 */
export class CambioEstadoDocumentacion {
  constructor(
    public readonly id: number | null,
    public readonly fechaHoraInicio: Date,
    public fechaHoraFin: Date | null,
    public readonly estado: Estado,
    public readonly empleado: Empleado,
  ) {}

  /** Cierra el cambio fijando su fecha y hora de fin. */
  setFechaHoraFin(fechaHoraFin: Date): void {
    this.fechaHoraFin = fechaHoraFin;
  }

  /** ¿Es el cambio de estado vigente? (todavía sin fecha de fin). */
  sosActual(): boolean {
    return this.fechaHoraFin === null;
  }
}
