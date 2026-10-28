import { Injectable } from '@nestjs/common';
import { IsNull } from 'typeorm';
import { ContextoPersistencia } from '../../../database/transaction/contexto-persistencia';
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
      for (const cambio of documentacion.cambiosEstado) {
        if (cambio.id === undefined) {
          await manager.insert(CambioEstadoDocumentacion, {
            documentacionId: documentacion.id,
            estadoId: cambio.estadoId,
            responsableId: cambio.responsableId,
            fechaHoraInicio: cambio.fechaHoraInicio,
            fechaHoraFin: cambio.fechaHoraFin,
          });
        } else if (cambio.fechaHoraFin !== null) {
          await manager.update(
            CambioEstadoDocumentacion,
            { id: cambio.id, fechaHoraFin: IsNull() },
            { fechaHoraFin: cambio.fechaHoraFin },
          );
        }
      }
    }
  }
}
