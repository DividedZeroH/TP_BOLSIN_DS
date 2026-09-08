import { Prisma } from '@prisma/client';
import { Empleado } from '../../../identidad';
import { Estado } from '../../../catalogo';
import { IBolsinRepository } from '../../application/ports/out/bolsin.repository';
import { Bolsin } from '../../domain/bolsin';
import { Documentacion } from '../../domain/documentacion';
import { BolsinMapper } from './bolsin.mapper';

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

/**
 * Adaptador de salida del agregado Bolsin: único punto que conoce Prisma y
 * SQLite. Recibe el cliente por constructor para que la unidad de trabajo
 * pueda instanciarlo ligado a una transacción abierta.
 */
export class PrismaBolsinRepository implements IBolsinRepository {
  constructor(
    private readonly prisma: Prisma.TransactionClient,
    private readonly mapper: BolsinMapper,
  ) {}

  async buscarEnviadosPorComisionDestino(
    comisionMedicaId: number,
  ): Promise<Bolsin[]> {
    const registros = await this.prisma.bolsin.findMany({
      where: {
        comisionMedicaDestinoId: comisionMedicaId,
        cambiosEstado: {
          some: {
            fechaHoraFin: null,
            estado: { Nombre: 'Enviado', Ambito: 'BOLSIN' },
          },
        },
      },
      include: bolsinCompletoInclude,
      orderBy: { numeroPrecinto: 'asc' },
    });
    return registros.map((registro) => this.mapper.mapearBolsin(registro));
  }

  async buscarPorIdYComisionDestino(
    bolsinId: number,
    comisionMedicaDestinoId: number,
  ): Promise<Bolsin | null> {
    const registro = await this.prisma.bolsin.findFirst({
      where: { id: bolsinId, comisionMedicaDestinoId },
      include: bolsinCompletoInclude,
    });
    return registro ? this.mapper.mapearBolsin(registro) : null;
  }

  async buscarPorId(bolsinId: number): Promise<Bolsin | null> {
    const registro = await this.prisma.bolsin.findUnique({
      where: { id: bolsinId },
      include: bolsinCompletoInclude,
    });
    return registro ? this.mapper.mapearBolsin(registro) : null;
  }

  async registrarCambioEstadoBolsin(
    bolsin: Bolsin,
    estado: Estado,
    empleado: Empleado,
    fechaHora: Date,
  ): Promise<void> {
    await this.prisma.cambioEstadoBolsin.updateMany({
      where: { bolsinId: bolsin.id, fechaHoraFin: null },
      data: { fechaHoraFin: fechaHora },
    });
    await this.prisma.cambioEstadoBolsin.create({
      data: {
        bolsinId: bolsin.id,
        estadoId: estado.id,
        empleadoId: empleado.id,
        fechaHoraInicio: fechaHora,
      },
    });
  }

  async actualizarEstadoRemitos(bolsin: Bolsin, estado: Estado): Promise<void> {
    await this.prisma.remito.updateMany({
      where: { bolsinId: bolsin.id },
      data: { estadoId: estado.id },
    });
  }

  async registrarCambioEstadoDocumentacion(
    documentacion: Documentacion,
    estado: Estado,
    empleado: Empleado,
    fechaHora: Date,
  ): Promise<void> {
    await this.prisma.cambioEstadoDocumentacion.updateMany({
      where: { documentacionId: documentacion.id, fechaHoraFin: null },
      data: { fechaHoraFin: fechaHora },
    });
    await this.prisma.cambioEstadoDocumentacion.create({
      data: {
        documentacionId: documentacion.id,
        estadoId: estado.id,
        empleadoId: empleado.id,
        fechaHoraInicio: fechaHora,
      },
    });
  }
}
