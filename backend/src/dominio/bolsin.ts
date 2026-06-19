import { Estado } from './estado';
import { ComisionMedica, Empleado } from './identidad';
import { Documentacion, Remito } from './documentacion';

export class CambioEstadoBolsin {
  constructor(
    public readonly id: number | null,
    public readonly fechaHoraInicio: Date,
    public fechaHoraFin: Date | null,
    public readonly estado: Estado,
    public readonly empleado: Empleado,
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

/**
 * Raíz del agregado recibido. Sus métodos reproducen la delegación del
 * diagrama: Bolsin -> Remito -> DetalleRemito -> Documentacion.
 */
export class Bolsin {
  constructor(
    public readonly id: number,
    public readonly fecha: Date,
    public readonly numeroBolsin: string,
    public readonly numeroPrecinto: string,
    public readonly peso: number,
    private readonly comisionMedicaOrigen: ComisionMedica,
    private readonly comisionMedicaDestino: ComisionMedica,
    private readonly remitos: Remito[],
    private readonly cambiosEstado: CambioEstadoBolsin[],
  ) {}

  sosEnviado(): boolean {
    return this.cambiosEstado.some((cambio) => cambio.sosEnviado());
  }

  obtenerCMDestino(): ComisionMedica {
    return this.comisionMedicaDestino;
  }

  obtenerCMOrigen(): ComisionMedica {
    return this.comisionMedicaOrigen;
  }

  getNumeroPrecinto(): string {
    return this.numeroPrecinto;
  }

  getNumeroBolsin(): string {
    return this.numeroBolsin;
  }

  buscarRemitoBolsin(): Remito[] {
    return this.remitos;
  }

  buscarDocumentacionBolsin(): Documentacion[] {
    return this.remitos.flatMap((remito) => remito.buscarDocumentacion());
  }

  getEstadoActual(): CambioEstadoBolsin | undefined {
    return this.cambiosEstado.find((cambio) => cambio.sosActual());
  }

  crearCambioEstado(estado: Estado, empleado: Empleado, fechaHora: Date): void {
    this.cambiosEstado.push(
      new CambioEstadoBolsin(null, fechaHora, null, estado, empleado),
    );
  }

  registrarCambioEstadoBolsin(estado: Estado, empleado: Empleado, fechaHora: Date): void {
    this.getEstadoActual()?.setFechaHoraFin(fechaHora);
    this.crearCambioEstado(estado, empleado, fechaHora);
  }

  actualizarEstadoRemito(estado: Estado): void {
    this.remitos.forEach((remito) => remito.recibidoAceptado(estado));
  }

  actualizarDocumentacion(estado: Estado, empleado: Empleado, fechaHora: Date): void {
    this.remitos.forEach((remito) =>
      remito.actualizarDocumentacion(estado, empleado, fechaHora),
    );
  }
}
