import { Injectable } from '@nestjs/common';
import { Documentacion } from '../../documentaciones/entity/documentacion.entity';
import { DocumentacionesService } from '../../documentaciones/service/documentaciones.service';
import { Empleado } from '../../empleados/entity/empleado.entity';
import { Estado } from '../../estados/entity/estado.entity';
import { DetalleRemito } from '../entity/detalle-remito.entity';

@Injectable()
export class DetalleRemitoService {
  constructor(private readonly documentacionesService: DocumentacionesService) {}

  buscarDocumentacion(detalle: DetalleRemito): Documentacion {
    return detalle.documentacion;
  }

  actualizarDocumentacion(
    detalle: DetalleRemito,
    estado: Estado,
    empleado: Empleado,
    fechaHora: Date,
  ): void {
    this.documentacionesService.recibir(
      detalle.documentacion,
      estado,
      empleado,
      fechaHora,
    );
  }
}
