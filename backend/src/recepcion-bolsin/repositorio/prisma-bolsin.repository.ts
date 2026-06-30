import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { IBolsinRepository } from './bolsin.repository';
import { BolsinResumenRegistro } from './bolsin-resumen.registro';
import { BolsinCompletoRegistro } from './bolsin-completo.registro';

/**
 * Incluye todas las relaciones que forman el agregado Bolsin. La constante se
 * comparte entre las consultas y el tipo generado por Prisma para impedir que
 * una modificación de la consulta deje al mapeo desactualizado.
 */
const bolsinCompletoInclude = Prisma.validator<Prisma.BolsinInclude>()({
  comisionMedicaOrigen: true,
  comisionMedicaDestino: true,
  cambiosEstado: {
    include: { estado: true, empleado: { include: { comisionMedica: true } } },
  },
  remitos: {
    include: {
      estado: true,
      detalles: {
        include: {
          documentacion: {
            include: {
              tipoDocumentacion: true,
              cambiosEstado: {
                include: {
                  estado: true,
                  empleado: { include: { comisionMedica: true } },
                },
              },
            },
          },
        },
      },
    },
  },
});

/** Única implementación que conoce Prisma/SQLite para el agregado Bolsin. */
@Injectable()
export class PrismaBolsinRepository implements IBolsinRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarEnviadosPorComisionDestino(
    comisionMedicaId: number,
  ): Promise<BolsinResumenRegistro[]> {
    return this.prisma.bolsin.findMany({
      where: {
        comisionMedicaDestinoId: comisionMedicaId,
        cambiosEstado: {
          some: {
            fechaHoraFin: null,
            estado: { Nombre: 'Enviado', Ambito: 'BOLSIN' },
          },
        },
      },
      include: { comisionMedicaOrigen: true },
      orderBy: { numeroPrecinto: 'asc' },
    });
  }

  async buscarCompletoPorIdYDestino(
    bolsinId: number,
    comisionMedicaDestinoId: number,
  ): Promise<BolsinCompletoRegistro | null> {
    return this.prisma.bolsin.findFirst({
      where: { id: bolsinId, comisionMedicaDestinoId },
      include: bolsinCompletoInclude,
    });
  }

  async buscarCompletoPorIdEnTx(
    tx: unknown,
    bolsinId: number,
  ): Promise<BolsinCompletoRegistro | null> {
    const cliente = this.comoClienteTransaccional(tx);
    return cliente.bolsin.findUnique({
      where: { id: bolsinId },
      include: bolsinCompletoInclude,
    });
  }

  async registrarCambioEstadoBolsin(
    tx: unknown,
    bolsinId: number,
    estadoId: number,
    empleadoId: number,
    fechaHora: Date,
  ): Promise<void> {
    const cliente = this.comoClienteTransaccional(tx);
    await cliente.cambioEstadoBolsin.updateMany({
      where: { bolsinId, fechaHoraFin: null },
      data: { fechaHoraFin: fechaHora },
    });
    await cliente.cambioEstadoBolsin.create({
      data: { bolsinId, estadoId, empleadoId, fechaHoraInicio: fechaHora },
    });
  }

  async actualizarEstadoRemitos(
    tx: unknown,
    bolsinId: number,
    estadoId: number,
  ): Promise<void> {
    const cliente = this.comoClienteTransaccional(tx);
    await cliente.remito.updateMany({
      where: { bolsinId },
      data: { estadoId },
    });
  }

  async registrarCambioEstadoDocumentacion(
    tx: unknown,
    documentacionId: number,
    estadoId: number,
    empleadoId: number,
    fechaHora: Date,
  ): Promise<void> {
    const cliente = this.comoClienteTransaccional(tx);
    await cliente.cambioEstadoDocumentacion.updateMany({
      where: { documentacionId, fechaHoraFin: null },
      data: { fechaHoraFin: fechaHora },
    });
    await cliente.cambioEstadoDocumentacion.create({
      data: { documentacionId, estadoId, empleadoId, fechaHoraInicio: fechaHora },
    });
  }

  async ejecutarEnTransaccion<T>(
    fn: (tx: unknown) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction((tx) => fn(tx));
  }

  /**
   * El tipo `Prisma.TransactionClient` solo existe dentro de esta
   * implementación: la interfaz expone `unknown` para no filtrar detalles de
   * Prisma hacia el servicio (DIP).
   */
  private comoClienteTransaccional(tx: unknown): Prisma.TransactionClient {
    return tx as Prisma.TransactionClient;
  }
}
