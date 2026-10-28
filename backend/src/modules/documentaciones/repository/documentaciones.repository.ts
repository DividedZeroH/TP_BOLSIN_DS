import { Injectable } from '@nestjs/common';
import { ContextoPersistencia } from '../../../database/transaction/contexto-persistencia';
import { guardarHistorialEstados } from '../../../database/historial-estados';
import { ContextoTransaccion } from '../../../shared/transaction/unidad-de-trabajo.interface';
import { Documentacion } from '../entity/documentacion.entity';
import { CambioEstadoDocumentacion } from '../entity/cambio-estado-documentacion.entity';
import { DocumentacionesRepositoryInterface } from './documentaciones.repository.interface';

@Injectable()
export class DocumentacionesRepository implements DocumentacionesRepositoryInterface {
  constructor(private readonly persistencia: ContextoPersistencia) {}
  async guardarCambiosEstado(
    documentaciones: Documentacion[],
    contexto: ContextoTransaccion,
  ): Promise<void> {
    const manager = this.persistencia.obtenerManagerTransaccional(contexto);
    for (const documentacion of documentaciones) {
      await guardarHistorialEstados(
        manager,
        CambioEstadoDocumentacion,
        documentacion.cambiosEstado,
        { documentacionId: documentacion.id },
      );
    }
  }
}
