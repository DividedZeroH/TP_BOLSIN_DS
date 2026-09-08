import { Prisma } from '@prisma/client';
import { Sesion } from '../../../domain/sesion';
import { ISesionRepository } from '../../../application/ports/sesion.repository';
import { IdentidadMapper } from './identidad.mapper';

/** Adaptador de salida para el agregado Sesion. */
export class PrismaSesionRepository implements ISesionRepository {
  constructor(
    private readonly prisma: Prisma.TransactionClient,
    private readonly mapper: IdentidadMapper,
  ) {}

  async buscarPorId(sesionId: number): Promise<Sesion | null> {
    const registro = await this.prisma.sesion.findUnique({
      where: { id: sesionId },
      include: {
        usuario: {
          include: { empleado: { include: { comisionMedica: true } } },
        },
      },
    });
    return registro ? this.mapper.mapearSesion(registro) : null;
  }
}
