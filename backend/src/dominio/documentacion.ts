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

  // TODO(flujos alternativos fuera de alcance de esta entrega): estos métodos
  // pertenecen al diagrama de clases pero solo los necesitan los flujos
  // FALTA_DOCUMENTACION / DOCUMENTACION_NO_CORRESPONDE / REDIRIGIR_OTRA_AREA,
  // que GestorRegistrarRecepcionBolsin.tomarOpcion() todavía rechaza. Se
  // implementan junto con el manejador de esa opción en
  // recepcion-bolsin.modelos.ts.

  darDeBaja(): void {
    throw new Error('No implementado: pertenece al flujo DOCUMENTACION_NO_CORRESPONDE.');
  }

  revision(): void {
    throw new Error('No implementado: pertenece al flujo FALTA_DOCUMENTACION.');
  }

  actualizarAsignacionDeRemito(): void {
    throw new Error('No implementado: pertenece al flujo REDIRIGIR_OTRA_AREA.');
  }

  actualizarAsignacionDeBolsin(): void {
    throw new Error('No implementado: pertenece al flujo REDIRIGIR_OTRA_AREA.');
  }

  retirarDeBolsin(): void {
    throw new Error('No implementado: pertenece al flujo DOCUMENTACION_NO_CORRESPONDE.');
  }
}



