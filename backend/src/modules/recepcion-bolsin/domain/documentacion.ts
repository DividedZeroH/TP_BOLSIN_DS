import { Empleado } from './empleado';
import { Estado } from './estado';
import { TipoDocumentacion } from './tipoDocumentacion';
import { CambioEstadoDocumentacion } from './cambioEstadoDocumentacion';
import { ComisionMedica } from './comisionMedica';

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

  mostrarTipoDocumentacion(): string {
    return this.tipoDocumentacion.getNombre();
  }

  getEstadoActual(): CambioEstadoDocumentacion | undefined {
    return this.cEDocumentacion.find((cambio) => cambio.sosActual());
  }

  crearCambioEstado(estado: Estado, empleado: Empleado, fechaHora: Date): void {
    this.cEDocumentacion.push(
      new CambioEstadoDocumentacion(null, fechaHora, null, estado, empleado),
    );
  }

  recibir(estadoAceptada: Estado, empleado: Empleado, fechaHora: Date): void {
    this.getEstadoActual()?.setFechaHoraFin(fechaHora);
    this.crearCambioEstado(estadoAceptada, empleado, fechaHora);
  }

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



