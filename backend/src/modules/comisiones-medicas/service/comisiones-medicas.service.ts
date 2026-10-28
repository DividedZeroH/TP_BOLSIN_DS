import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ComisionMedica } from '../entity/comision-medica.entity';

import {
  COMISIONES_MEDICAS_REPOSITORY,
  ComisionesMedicasRepositoryInterface,
} from '../repository/comisiones-medicas.repository.interface';
@Injectable()
export class ComisionesMedicasService {
  constructor(
    @Inject(COMISIONES_MEDICAS_REPOSITORY)
    private readonly repository: ComisionesMedicasRepositoryInterface,
  ) {}
  async buscarComisionMedica(id: number): Promise<ComisionMedica> {
    const comision = await this.repository.buscarPorId(id);
    if (!comision)
      throw new NotFoundException('No se encontró la comisión médica indicada.');
    return comision;
  }
  getNombre(comision: ComisionMedica): string {
    return comision.nombre;
  }
}
