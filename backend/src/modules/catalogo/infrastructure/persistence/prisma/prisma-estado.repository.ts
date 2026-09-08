import { Prisma } from '@prisma/client';
import { Estado } from '../../../domain/estado';
import { IEstadoRepository } from '../../../application/ports/estado.repository';
import { EstadoMapper } from './estado.mapper';

/**
 * Adaptador de salida para el catálogo Estado.
 *
 * Recibe el cliente Prisma por constructor (`Prisma.TransactionClient` acepta
 * tanto el `PrismaService` como el cliente de una transacción abierta), de modo
 * que la unidad de trabajo puede construir una instancia ligada a la
 * transacción sin que ese detalle atraviese la capa de aplicación.
 */
export class PrismaEstadoRepository implements IEstadoRepository {
  constructor(
    private readonly prisma: Prisma.TransactionClient,
    private readonly mapper: EstadoMapper,
  ) {}

  async buscarPorNombreYAmbito(
    nombre: string,
    ambito: string,
  ): Promise<Estado | null> {
    const registro = await this.prisma.estado.findUnique({
      where: { Nombre_Ambito: { Nombre: nombre, Ambito: ambito } },
    });
    return registro ? this.mapper.mapear(registro) : null;
  }

  async buscarEstadoBolsinPorNombre(nombre: string): Promise<Estado | null> {
    const registro = await this.prisma.estado.findFirst({
      where: { Nombre: nombre, Ambito: 'BOLSIN' },
    });
    return registro ? this.mapper.mapear(registro) : null;
  }
}
