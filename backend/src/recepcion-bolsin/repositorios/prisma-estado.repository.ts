import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { IEstadoRepository } from './estado.repository';
import { EstadoRegistro } from './estado.registro';

/** Única implementación que conoce Prisma/SQLite para el catálogo Estado. */
@Injectable()
export class PrismaEstadoRepository implements IEstadoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorNombreYAmbito(
    nombre: string,
    ambito: string,
  ): Promise<EstadoRegistro | null> {
    return this.prisma.estado.findUnique({
      where: { Nombre_Ambito: { Nombre: nombre, Ambito: ambito } },
    });
  }

  async buscarPorNombreYAmbitoEnTx(
    tx: unknown,
    nombre: string,
    ambito: string,
  ): Promise<EstadoRegistro | null> {
    const cliente = this.comoClienteTransaccional(tx);
    return cliente.estado.findUnique({
      where: { Nombre_Ambito: { Nombre: nombre, Ambito: ambito } },
    });
  }

  async buscarEstadoBolsinPorNombre(
    tx: unknown,
    nombre: string,
  ): Promise<EstadoRegistro | null> {
    const cliente = this.comoClienteTransaccional(tx);
    return cliente.estado.findFirst({
      where: { Nombre: nombre, Ambito: 'BOLSIN', SosAmbitoBolsin: true },
    });
  }

  /**
   * El tipo `Prisma.TransactionClient` solo existe dentro de esta
   * implementación: la interfaz expone `unknown` para no filtrar detalles de
   * Prisma hacia el gestor (DIP).
   */
  private comoClienteTransaccional(tx: unknown): Prisma.TransactionClient {
    return tx as Prisma.TransactionClient;
  }
}
