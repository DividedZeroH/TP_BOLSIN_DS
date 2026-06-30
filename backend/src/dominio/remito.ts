import { Empleado } from './empleado';
import { Estado } from './estado';
import { DetalleRemito } from './detalleRemito';
import { Documentacion } from './documentacion';
import { ComisionMedica } from './comisionMedica';

/**
 * Entidad Remito del modelo. Forma parte del agregado Bolsin y agrupa la
 * documentación a través de sus DetalleRemito. Reproduce la delegación del
 * diagrama: Remito -> DetalleRemito -> Documentacion.
 */
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

  /** Marca el remito como recibido y aceptado fijando el estado correspondiente. */
  recibidoAceptado(estado: Estado): void {
    this.setEstado(estado);
  }

  /** Devuelve la documentación de todos los detalles del remito. */
  buscarDocumentacion(): Documentacion[] {
    return this.detalles.map((detalle) => detalle.buscarDocumentacion());
  }

  /** Propaga la recepción a la documentación de cada detalle del remito. */
  actualizarDocumentacion(estado: Estado, empleado: Empleado, fechaHora: Date): void {
    this.detalles.forEach((detalle) =>
      detalle.actualizarDocumentacion(estado, empleado, fechaHora),
    );
  }
}
