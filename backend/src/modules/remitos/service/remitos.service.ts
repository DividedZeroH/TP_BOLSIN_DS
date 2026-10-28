import { Inject, Injectable } from '@nestjs/common';
import { Remito } from '../entity/remito.entity';
import { DetalleRemitoService } from './detalle-remito.service';
import { Documentacion } from '../../documentaciones/entity/documentacion.entity';
import { DocumentacionesService } from '../../documentaciones/service/documentaciones.service';
import { Estado } from '../../estados/entity/estado.entity';
import { Empleado } from '../../empleados/entity/empleado.entity';
import { ContextoTransaccion } from '../../../shared/transaction/unidad-de-trabajo.interface';
import {
  REMITOS_REPOSITORY,
  RemitosRepositoryInterface,
} from '../repository/remitos.repository.interface';

export interface DocumentacionEncontrada {
  documentacion: Documentacion;
  remitoId: number;
  tipo: string;
  asunto: string;
}

@Injectable()
export class RemitosService {
  constructor(
    @Inject(REMITOS_REPOSITORY) private readonly repository: RemitosRepositoryInterface,
    private readonly documentacionesService: DocumentacionesService,
    private readonly detalles: DetalleRemitoService,
  ) {}
  guardarEstados(remitos: Remito[], contexto: ContextoTransaccion): Promise<void> {
    return this.repository.guardarEstados(remitos, contexto);
  }
  getNumero(remito: Remito): number {
    return remito.numero;
  }
  setEstado(remito: Remito, estado: Estado): void {
    remito.estado = estado;
    remito.estadoId = estado.id;
  }
  recibidoAceptado(remito: Remito, estado: Estado): void {
    this.setEstado(remito, estado);
  }
  buscarDocumentacion(remito: Remito): DocumentacionEncontrada[] {
    return remito.detalles.map((detalle) => {
      const documentacion = this.detalles.buscarDocumentacion(detalle);
      const tipo = this.documentacionesService.mostrarTipoDocumentacion(documentacion);
      const asunto = this.documentacionesService.getAsunto(documentacion);
      return { documentacion, remitoId: remito.id, tipo, asunto };
    });
  }
  actualizarDocumentacion(
    remito: Remito,
    estado: Estado,
    empleado: Empleado,
    fechaHora: Date,
  ): void {
    remito.detalles.forEach((detalle) =>
      this.detalles.actualizarDocumentacion(detalle, estado, empleado, fechaHora),
    );
  }
}
