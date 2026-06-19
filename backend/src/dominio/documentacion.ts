import { Empleado } from './identidad';
import { Estado } from './estado';

export class TipoDocumentacion {
  constructor(
    public readonly id: number,
    public readonly descripcion: string,
    public readonly nombre: string,
  ) {}

  getDescripcion(): string {
    return this.descripcion;
  }

  getNombre(): string {
    return this.nombre;
  }
}

/** Registro histórico que conserva cuándo comenzó y finalizó cada estado. */
export class CambioEstadoDocumentacion {
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
}

export class Documentacion {
  constructor(
    public readonly id: number,
    public readonly asunto: string,
    public readonly fechaPase: Date,
    public readonly numero: string,
    private readonly tipoDocumentacion: TipoDocumentacion,
    private readonly cambiosEstado: CambioEstadoDocumentacion[],
  ) {}

  getAsunto(): string {
    return this.asunto;
  }

  mostrarTipoDocumentacion(): string {
    return this.tipoDocumentacion.getNombre();
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
   * Transición normal de la máquina de estados: finaliza el estado vigente y
   * agrega Aceptada. La escritura definitiva se realiza luego con Prisma.
   */
  recibir(estadoAceptada: Estado, empleado: Empleado, fechaHora: Date): void {
    this.getEstadoActual()?.setFechaHoraFin(fechaHora);
    this.crearCambioEstado(estadoAceptada, empleado, fechaHora);
  }
}

export class DetalleRemito {
  constructor(
    public readonly id: number,
    public readonly areaCMCDestino: string,
    private readonly documentacion: Documentacion,
  ) {}

  getDocumentacion(): Documentacion {
    return this.documentacion;
  }

  mostrarDocumentacion(): Documentacion {
    return this.documentacion;
  }

  actualizarDocumentacion(estado: Estado, empleado: Empleado, fechaHora: Date): void {
    this.documentacion.recibir(estado, empleado, fechaHora);
  }
}

export class Remito {
  constructor(
    public readonly id: number,
    public readonly fecha: Date,
    public readonly Numero: string,
    private estado: Estado,
    private readonly detalles: DetalleRemito[],
  ) {}

  getNumero(): string {
    return this.Numero;
  }

  setEstado(estado: Estado): void {
    this.estado = estado;
  }

  recibidoAceptado(estado: Estado): void {
    this.setEstado(estado);
  }

  buscarDocumentacion(): Documentacion[] {
    return this.detalles.map((detalle) => detalle.getDocumentacion());
  }

  actualizarDocumentacion(estado: Estado, empleado: Empleado, fechaHora: Date): void {
    this.detalles.forEach((detalle) =>
      detalle.actualizarDocumentacion(estado, empleado, fechaHora),
    );
  }
}
