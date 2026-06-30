import { Estado } from './estado';
import { Empleado } from './empleado';

/**
 * Entidad CambioEstadoBolsin del modelo: una entrada del historial de estados
 * de un Bolsin. `fechaHoraFin` en null marca el cambio vigente; al cerrarlo se
 * completa la fecha y se abre uno nuevo. `responsableCE` es el empleado que
 * registró el cambio. `id` es null mientras el cambio solo existe en memoria.
 */
export class CambioEstadoBolsin {
  constructor(
    public readonly id: number | null,
    public readonly fechaHoraInicio: Date,
    public fechaHoraFin: Date | null,
    public readonly estado: Estado,
    public readonly responsableCE: Empleado,
  ) {}

  /** Cierra el cambio fijando su fecha y hora de fin. */
  setFechaHoraFin(fechaHoraFin: Date): void {
    this.fechaHoraFin = fechaHoraFin;
  }

  /** ¿Es el cambio de estado vigente? (todavía sin fecha de fin). */
  sosActual(): boolean {
    return this.fechaHoraFin === null;
  }

  /** ¿Es el cambio vigente y además corresponde al estado "Enviado"? */
  sosEnviado(): boolean {
    return this.sosActual() && this.estado.sosEnviado();
  }
}
