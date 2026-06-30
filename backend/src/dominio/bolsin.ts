import { Estado } from './estado';
import { Empleado } from './empleado';
import { ComisionMedica } from './comisionMedica';
import { Remito } from './remito';
import { CambioEstadoBolsin} from './cambioEstadoBolsin';
import { Documentacion } from './documentacion';

/**
 * Raíz del agregado recibido. Controla el acceso a sus partes y lleva su propio
 * historial de estados. Sus métodos reproducen la delegación del diagrama:
 * Bolsin -> Remito -> DetalleRemito -> Documentacion.
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

  /** ¿El cambio de estado vigente del bolsín es "Enviado"? */
  sosEnviado(): boolean {
    return this.cambiosEstado.some((cambio) => cambio.sosEnviado());
  }

  /** Comisión médica de destino (la que recibe el bolsín). */
  obtenerTuCMDestino(): ComisionMedica {
    return this.comisionMedicaDestino;
  }

  /** Comisión médica de origen (la que envió el bolsín). */
  obtenerCMOrigen(): ComisionMedica {
    return this.comisionMedicaOrigen;
  }

  getNumeroPrecinto(): number {
    return this.numeroPrecinto;
  }

  /** Remitos contenidos en el bolsín. */
  buscarRemitoBolsin(): Remito[] {
    return this.remitos;
  }

  /** Toda la documentación del bolsín, aplanando la de cada remito. */
  buscarDocumentacionBolsin(): Documentacion[] {
    return this.remitos.flatMap((remito) => remito.buscarDocumentacion());
  }

  /** Cambio de estado vigente del bolsín (sin fechaHoraFin), si existe. */
  getEstadoActual(): CambioEstadoBolsin | undefined {
    return this.cambiosEstado.find((cambio) => cambio.sosActual());
  }

  /** Agrega un nuevo cambio de estado abierto al historial del bolsín. */
  crearCambioEstado(estado: Estado, empleado: Empleado, fechaHora: Date): void {
    this.cambiosEstado.push(
      new CambioEstadoBolsin(null, fechaHora, null, estado, empleado),
    );
  }

  /** Cierra el cambio de estado vigente y abre uno nuevo con el estado dado. */
  registrarCambioEstadoBolsin(estado: Estado, empleado: Empleado, fechaHora: Date): void {
    this.getEstadoActual()?.setFechaHoraFin(fechaHora);
    this.crearCambioEstado(estado, empleado, fechaHora);
  }

  /** Marca todos los remitos como recibidos y aceptados. */
  actualizarEstadoRemito(estado: Estado): void {
    this.remitos.forEach((remito) => remito.recibidoAceptado(estado));
  }

  /** Propaga la recepción a la documentación de todos los remitos. */
  actualizarDocumentacion(estado: Estado, empleado: Empleado, fechaHora: Date): void {
    this.remitos.forEach((remito) =>
      remito.actualizarDocumentacion(estado, empleado, fechaHora),
    );
  }
}
