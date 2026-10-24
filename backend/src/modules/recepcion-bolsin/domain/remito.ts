import { Estado } from '../../catalogo/domain/estado';
import { Empleado } from '../../identidad/domain/empleado';
import { ComisionMedica } from '../../organizacion/domain/comision-medica';
import { DetalleRemito } from './detalle-remito';
import { Documentacion } from './documentacion';

/**
 * El diagrama asocia Remito directamente a Estado (sin lista de cambios), así
 * que el remito es la única entidad con estado asignable.
 */
export class Remito {
  constructor(
    public readonly id: number,
    public readonly numero: number,
    private estado: Estado,
    private readonly detalles: DetalleRemito[],
    private readonly cmOrigen: ComisionMedica,
    private readonly cmDestino: ComisionMedica,
  ) {}

  getNumero(): number {
    return this.numero;
  }

  getEstado(): Estado {
    return this.estado;
  }

  getCMOrigen(): ComisionMedica {
    return this.cmOrigen;
  }

  getCMDestino(): ComisionMedica {
    return this.cmDestino;
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
