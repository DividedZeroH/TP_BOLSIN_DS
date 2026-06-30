import { Empleado } from './empleado';
import { Estado } from './estado';
import { Documentacion } from './documentacion';

/**
 * Entidad DetalleRemito del modelo: asocia un Remito con una Documentacion
 * concreta. Es el eslabón intermedio del agregado (Remito -> DetalleRemito ->
 * Documentacion) y se limita a delegar en su documentación.
 */
export class DetalleRemito {
  constructor(
    public readonly id: number,
    private readonly documentacion: Documentacion,
  ) {}

  /** Devuelve la documentación asociada a este detalle. */
  buscarDocumentacion(): Documentacion {
    return this.documentacion;
  }

  /** Delega la recepción de la documentación de este detalle. */
  actualizarDocumentacion(estado: Estado, empleado: Empleado, fechaHora: Date): void {
    this.documentacion.recibir(estado, empleado, fechaHora);
  }
}
