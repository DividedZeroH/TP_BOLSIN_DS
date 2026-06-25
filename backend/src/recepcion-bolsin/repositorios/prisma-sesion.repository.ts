import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ISesionRepository } from './sesion.repository';
import { SesionConUsuarioRegistro } from './sesion-con-usuario.registro';

/** Única implementación que conoce Prisma/SQLite para el agregado Sesion. */
@Injectable()
export class PrismaSesionRepository implements ISesionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarConUsuarioYEmpleado(
    sesionId: number,
  ): Promise<SesionConUsuarioRegistro | null> {
    return this.prisma.sesion.findUnique({
      where: { id: sesionId },
      include: {
        usuario: {
          include: { empleado: { include: { comisionMedica: true } } },
        },
      },
    });
  }
}
