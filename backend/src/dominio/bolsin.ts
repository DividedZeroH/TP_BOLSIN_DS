import { Estado } from './estado';
import { Empleado } from './empleado';
import { ComisionMedica } from './comisionMedica';
import { Remito } from './remito';
import { CambioEstadoBolsin} from './cambioEstadoBolsin';
import { Documentacion } from './documentacion';

/**
 * Raíz del agregado recibido. Sus métodos reproducen la delegación del
 * diagrama: Bolsin -> Remito -> DetalleRemito -> Documentacion.
 */
export class Bolsin {
  constructor(
    public readonly id: number,
    public readonly numeroPrecinto: number,
    private readonly comisionMedicaOrigen: ComisionMedica,
    private readonly comisionMedicaDestino: ComisionMedica,
    private readonly remitos: Remito[],
    private readonly cambiosEstado: CambioEstadoBolsin[],
  ) {}

  sosEnviado(): boolean {
    return this.cambiosEstado.some((cambio) => cambio.sosEnviado());
  }

  obtenerTuCMDestino(): ComisionMedica {
    return this.comisionMedicaDestino;
  }

  obtenerCMOrigen(): ComisionMedica {
    return this.comisionMedicaOrigen;
  }

  getNumeroPrecinto(): number {
    return this.numeroPrecinto;
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
