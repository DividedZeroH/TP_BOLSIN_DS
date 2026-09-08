
import { Empleado } from '../../identidad';
import { Estado } from '../../catalogo';
import { Documentacion } from './documentacion';


export class DetalleRemito {
  constructor(
    public readonly id: number,
    private readonly documentacion: Documentacion,

  ) {}

  buscarDocumentacion(): Documentacion {
    return this.documentacion;
  }


  actualizarDocumentacion(estado: Estado, empleado: Empleado, fechaHora: Date): void {
    this.documentacion.recibir(estado, empleado, fechaHora);
  }
}