
import { Empleado } from './empleado';
import { Estado } from './estado';
import { DetalleRemito } from './detalleRemito';
import { Documentacion } from './documentacion';
import { ComisionMedica } from './comisionMedica';

export class Remito {
  constructor(
    public readonly id: number,
    public readonly Numero: number,
    private estado: Estado,
    private readonly detalles: DetalleRemito[],
    private readonly Origen: ComisionMedica,
    private readonly Destino: ComisionMedica,
  ) {}

  getNumero(): number {
    return this.Numero;
  }

  setEstado(estado: Estado): void {
    this.estado = estado;
  }

  recibidoAceptado(estado: Estado): void {
    this.setEstado(estado);
  }

  buscarDocumentacion(): Documentacion[] {
    return this.detalles.map((detalle) => detalle.buscarDocumentacion());
  }

  actualizarDocumentacion(estado: Estado, empleado: Empleado, fechaHora: Date): void {
    this.detalles.forEach((detalle) =>
      detalle.actualizarDocumentacion(estado, empleado, fechaHora),
    );
  }
}
