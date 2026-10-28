import { Inject, Injectable } from '@nestjs/common';
import { Documentacion } from '../entity/documentacion.entity';
import { CambioEstadoDocumentacion } from '../entity/cambio-estado-documentacion.entity';
import { TipoDocumentacionService } from './tipo-documentacion.service';
import { CambioEstadoDocumentacionService } from './cambio-estado-documentacion.service';
import { Estado } from '../../estados/entity/estado.entity';
import { Empleado } from '../../empleados/entity/empleado.entity';
import { ContextoTransaccion } from '../../../shared/transaction/unidad-de-trabajo.interface';
import {
  DOCUMENTACIONES_REPOSITORY,
  DocumentacionesRepositoryInterface,
} from '../repository/documentaciones.repository.interface';

@Injectable()
export class DocumentacionesService {
  constructor(
    @Inject(DOCUMENTACIONES_REPOSITORY)
    private readonly repository: DocumentacionesRepositoryInterface,
    private readonly tipos: TipoDocumentacionService,
    private readonly cambiosEstado: CambioEstadoDocumentacionService,
  ) {}
  guardarCambiosEstado(
    documentaciones: Documentacion[],
    contexto: ContextoTransaccion,
  ): Promise<void> {
    return this.repository.guardarCambiosEstado(documentaciones, contexto);
  }
  getAsunto(documentacion: Documentacion): string {
    return documentacion.asunto;
  }
  mostrarTipoDocumentacion(documentacion: Documentacion): string {
    return this.tipos.getNombre(documentacion.tipoDocumentacion);
  }
  getEstadoActual(documentacion: Documentacion): CambioEstadoDocumentacion | undefined {
    return documentacion.cambiosEstado.find((cambio) =>
      this.cambiosEstado.sosActual(cambio),
    );
  }
  crearCambioEstado(
    documentacion: Documentacion,
    estado: Estado,
    empleado: Empleado,
    fechaHora: Date,
  ): void {
    const cambio = Object.assign(new CambioEstadoDocumentacion(), {
      documentacionId: documentacion.id,
      estadoId: estado.id,
      estado,
      responsableId: empleado.id,
      responsable: empleado,
      fechaHoraInicio: fechaHora,
      fechaHoraFin: null,
    });
    documentacion.cambiosEstado.push(cambio);
  }
  recibir(
    documentacion: Documentacion,
    estadoRecibidoYAceptado: Estado,
    empleado: Empleado,
    fechaHora: Date,
  ): void {
    const actual = this.getEstadoActual(documentacion);
    if (actual) this.cambiosEstado.setFechaHoraFin(actual, fechaHora);
    this.crearCambioEstado(documentacion, estadoRecibidoYAceptado, empleado, fechaHora);
  }
  // Transiciones de otros CU: se declaran por fidelidad al diagrama de clases y
  // quedan vacías, porque implementarlas sin un CU que las use iría contra YAGNI.
  revision(): void {}
  darDeBaja(): void {}
  actualizarAsignacionDeRemito(): void {}
  actualizarAsignacionDeBolsin(): void {}
  retirarDeBolsin(): void {}
}
