import { Injectable } from '@nestjs/common';
import { FindOptionsRelations, IsNull } from 'typeorm';
import { ContextoPersistencia } from '../../../database/transaction/contexto-persistencia';
import { ContextoTransaccion } from '../../../shared/transaction/unidad-de-trabajo.interface';
import { Bolsin } from '../entity/bolsin.entity';
import { CambioEstadoBolsin } from '../entity/cambio-estado-bolsin.entity';
import { BolsinesRepositoryInterface } from './bolsines.repository.interface';

const RESPONSABLE = { comisionMedica: true } as const;
const RELACIONES_BOLSIN: FindOptionsRelations<Bolsin> = {
  cmOrigen: true,
  cmDestino: true,
  cambiosEstado: { estado: true, responsable: RESPONSABLE },
  remitos: {
    estado: true,
    cmOrigen: true,
    cmDestino: true,
    detalles: {
      documentacion: {
        tipoDocumentacion: true,
        cmOrigen: true,
        cambiosEstado: { estado: true, responsable: RESPONSABLE },
      },
    },
  },
};
@Injectable()
export class BolsinesRepository implements BolsinesRepositoryInterface {
  constructor(private readonly persistencia: ContextoPersistencia) {}
  buscarPorDestino(comisionId: number): Promise<Bolsin[]> {
    return this.persistencia.obtenerManager().find(Bolsin, {
      where: { cmDestinoId: comisionId },
      relations: RELACIONES_BOLSIN,
      order: { numeroPrecinto: 'ASC', remitos: { id: 'ASC' } },
    });
  }
  async buscarParaActualizar(
    numeroPrecinto: number,
    contexto: ContextoTransaccion,
  ): Promise<Bolsin | null> {
    const manager = this.persistencia.obtenerManagerTransaccional(contexto);
    await manager.query(
      'SELECT "id" FROM "bolsin" WHERE "numero_precinto" = $1 FOR UPDATE',
      [numeroPrecinto],
    );
    return manager.findOne(Bolsin, {
      where: { numeroPrecinto },
      relations: RELACIONES_BOLSIN,
      order: { remitos: { id: 'ASC' } },
    });
  }
  async guardarCambiosEstado(
    bolsin: Bolsin,
    contexto: ContextoTransaccion,
  ): Promise<void> {
    const manager = this.persistencia.obtenerManagerTransaccional(contexto);
    for (const cambio of bolsin.cambiosEstado) {
      if (cambio.id === undefined) {
        await manager.insert(CambioEstadoBolsin, {
          bolsinId: bolsin.id,
          estadoId: cambio.estadoId,
          responsableId: cambio.responsableId,
          fechaHoraInicio: cambio.fechaHoraInicio,
          fechaHoraFin: cambio.fechaHoraFin,
        });
      } else if (cambio.fechaHoraFin !== null) {
        await manager.update(
          CambioEstadoBolsin,
          { id: cambio.id, fechaHoraFin: IsNull() },
          { fechaHoraFin: cambio.fechaHoraFin },
        );
      }
    }
  }
}
