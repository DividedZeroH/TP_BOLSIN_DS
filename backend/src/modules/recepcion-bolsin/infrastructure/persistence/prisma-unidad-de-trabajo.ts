import { Injectable } from '@nestjs/common';
import { EstadoMapper, PrismaEstadoRepository } from '../../../catalogo';
import { PrismaService } from '../../../../platform/persistence/prisma/prisma.service';
import {
  ContextoTransaccional,
  IUnidadDeTrabajo,
} from '../../application/ports/out/unidad-de-trabajo';
import { BolsinMapper } from './bolsin.mapper';
import { PrismaBolsinRepository } from './prisma-bolsin.repository';

/**
 * Implementa la unidad de trabajo con `$transaction` de Prisma: abre la
 * transacción y arma repositorios ligados a ella. El gestor recibe las mismas
 * interfaces de puerto de siempre, sin enterarse de la transacción.
 *
 * El adaptador de Estado se compone desde la API pública del subdominio
 * Catálogo, que lo expone justamente para este caso.
 */
@Injectable()
export class PrismaUnidadDeTrabajo implements IUnidadDeTrabajo {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bolsinMapper: BolsinMapper,
    private readonly estadoMapper: EstadoMapper,
  ) {}

  async ejecutar<T>(
    trabajo: (contexto: ContextoTransaccional) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction((tx) =>
      trabajo({
        bolsines: new PrismaBolsinRepository(tx, this.bolsinMapper),
        estados: new PrismaEstadoRepository(tx, this.estadoMapper),
      }),
    );
  }
}
