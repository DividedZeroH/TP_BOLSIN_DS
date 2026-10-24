import { Estado } from '../../catalogo/domain/estado';
import { Empleado } from '../../identidad/domain/empleado';
import { ComisionMedica } from '../../organizacion/domain/comision-medica';
import { CambioEstadoDocumentacion } from './cambio-estado-documentacion';
import { TipoDocumentacion } from './tipo-documentacion';

export class Documentacion {
  constructor(
    public readonly id: number,
    public readonly asunto: string,
    private readonly tipoDocumentacion: TipoDocumentacion,
    private readonly cmOrigen: ComisionMedica,
    private readonly cambiosEstado: CambioEstadoDocumentacion[],
  ) {}

  getAsunto(): string {
    return this.asunto;
  }

  mostrarTipoDocumentacion(): string {
    return this.tipoDocumentacion.getNombre();
  }

  getCMOrigen(): ComisionMedica {
    return this.cmOrigen;
  }

  getCambiosEstado(): readonly CambioEstadoDocumentacion[] {
    return this.cambiosEstado;
  }

  getEstadoActual(): CambioEstadoDocumentacion | undefined {
    return this.cambiosEstado.find((cambio) => cambio.sosActual());
  }

  crearCambioEstado(estado: Estado, empleado: Empleado, fechaHora: Date): void {
    this.cambiosEstado.push(
      new CambioEstadoDocumentacion(null, fechaHora, null, estado, empleado),
    );
  }

  /**
   * Única transición que usa el CU28 (rama `CONTENIDO_IGUAL`):
   * `EnBolsinEnviado` -> `Aceptada`.
   */
  recibir(estadoAceptada: Estado, empleado: Empleado, fechaHora: Date): void {
    this.getEstadoActual()?.setFechaHoraFin(fechaHora);
    this.crearCambioEstado(estadoAceptada, empleado, fechaHora);
  }

  // Transiciones de la máquina de estados que pertenecen a otros CU. Se
  // declaran para que la clase coincida con el diagrama, pero el CU28 no las
  // invoca.
  revision(): void {}

  darDeBaja(): void {}

  actualizarAsignacionDeRemito(): void {}

  actualizarAsignacionDeBolsin(): void {}

  retirarDeBolsin(): void {}
}
