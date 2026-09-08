
import { Estado } from '../../catalogo';
import { Empleado } from '../../identidad';

export class CambioEstadoBolsin {
  constructor(
    public readonly id: number | null,
    public readonly fechaHoraInicio: Date,
    public fechaHoraFin: Date | null,
    public readonly estado: Estado,
    public readonly responsableCE: Empleado,
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