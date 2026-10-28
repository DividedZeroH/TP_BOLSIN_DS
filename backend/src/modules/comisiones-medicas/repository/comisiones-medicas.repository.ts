import { Injectable } from '@nestjs/common';
import { ContextoPersistencia } from '../../../database/transaction/contexto-persistencia';
import { ComisionMedica } from '../entity/comision-medica.entity';
import { ComisionesMedicasRepositoryInterface } from './comisiones-medicas.repository.interface';

@Injectable()
export class ComisionesMedicasRepository implements ComisionesMedicasRepositoryInterface {
  constructor(private readonly persistencia: ContextoPersistencia) {}

  buscarPorId(id: number): Promise<ComisionMedica | null> {
    return this.persistencia.obtenerManager().findOneBy(ComisionMedica, { id });
  }
}
