import { Injectable } from '@nestjs/common';
import { ContextoPersistencia } from '../../../database/transaction/contexto-persistencia';
import { ContextoTransaccion } from '../../../shared/transaction/unidad-de-trabajo.interface';
import { Remito } from '../entity/remito.entity';
import { RemitosRepositoryInterface } from './remitos.repository.interface';

@Injectable()
export class RemitosRepository implements RemitosRepositoryInterface {
  constructor(private readonly persistencia: ContextoPersistencia) {}
  async guardarEstados(remitos: Remito[], contexto: ContextoTransaccion): Promise<void> {
    const manager = this.persistencia.obtenerManagerTransaccional(contexto);
    for (const remito of remitos)
      await manager.update(Remito, { id: remito.id }, { estadoId: remito.estadoId });
  }
}
