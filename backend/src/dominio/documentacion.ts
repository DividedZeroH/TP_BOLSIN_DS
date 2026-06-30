import { Empleado } from './empleado';
import { Estado } from './estado';
import { TipoDocumentacion } from './tipoDocumentacion';
import { CambioEstadoDocumentacion } from './cambioEstadoDocumentacion';
import { ComisionMedica } from './comisionMedica';

/**
 * Entidad Documentacion del modelo. Lleva su propio historial de estados
 * (`cEDocumentacion`) y conoce su comisión médica de origen (`cMorigen`). Los
 * métodos vacíos al final son operaciones del diagrama previstas para los
 * flujos alternativos (A1–A6), que quedan fuera del alcance de esta entrega.
 */
export class Documentacion {
  constructor(
    public readonly id: number,
    public readonly asunto: string,
    private readonly tipoDocumentacion: TipoDocumentacion,
    private readonly cEDocumentacion: CambioEstadoDocumentacion[],
    private readonly cMorigen: ComisionMedica,
  ) {}

  getAsunto(): string {
    return this.asunto;
  }

  /** Nombre del tipo de documentación, para mostrar en pantalla. */
  mostrarTipoDocumentacion(): string {
    return this.tipoDocumentacion.getNombre();
  }

  /** Cambio de estado abierto (sin fechaHoraFin), o undefined si no hay. */
  getEstadoActual(): CambioEstadoDocumentacion | undefined {
    return this.cEDocumentacion.find((cambio) => cambio.sosActual());
  }

  /** Abre un nuevo cambio de estado para la documentación. */
  crearCambioEstado(estado: Estado, empleado: Empleado, fechaHora: Date): void {
    this.cEDocumentacion.push(
      new CambioEstadoDocumentacion(null, fechaHora, null, estado, empleado),
    );
  }

  /** Recibe la documentación: cierra el estado actual y abre el de aceptada. */
  recibir(estadoAceptada: Estado, empleado: Empleado, fechaHora: Date): void {
    this.getEstadoActual()?.setFechaHoraFin(fechaHora);
    this.crearCambioEstado(estadoAceptada, empleado, fechaHora);
  }

  // --- Operaciones del modelo reservadas para flujos alternativos (no implementadas) ---

  darDeBaja(): void {
  }

  revision(): void {
  }

  actualizarAsignacionDeRemito(): void {
  }

  actualizarAsignacionDeBolsin(): void {
  }

  retirarDeBolsin(): void {
  }
}
