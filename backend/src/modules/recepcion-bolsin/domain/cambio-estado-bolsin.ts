import { Estado } from '../../catalogo/domain/estado';
import { Empleado } from '../../identidad/domain/empleado';

export class CambioEstadoBolsin {
  constructor(
    /** `null` mientras el cambio no fue persistido. */
    public readonly id: number | null,
    public readonly fechaHoraInicio: Date,
    public fechaHoraFin: Date | null,
    public readonly estado: Estado,
    public readonly responsable: Empleado,
  ) {}

  setFechaHoraFin(fechaHoraFin: Date): void {
    this.fechaHoraFin = fechaHoraFin;
  }

  sosActual(): boolean {
    return this.fechaHoraFin === null;
  }

  sosEnviado(): boolean {
    return this.sosActual() && this.estado.sosEnviado();
  }
}
