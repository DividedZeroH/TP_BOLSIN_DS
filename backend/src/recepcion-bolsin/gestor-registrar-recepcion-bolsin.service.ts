import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Estado } from '../dominio/estado';
import { Empleado } from '../dominio/empleado';
import { ComisionMedica } from '../dominio/comisionMedica';
import { Remito } from '../dominio/remito';
import { Documentacion } from '../dominio/documentacion';
import { Bolsin } from '../dominio/bolsin';
import { CambioEstadoBolsin } from '../dominio/cambioEstadoBolsin';
import { CambioEstadoDocumentacion } from '../dominio/cambioEstadoDocumentacion';
import { DetalleRemito } from '../dominio/detalleRemito';
import { TipoDocumentacion } from '../dominio/tipoDocumentacion';
import { Sesion } from '../dominio/sesion';
import { Usuario } from '../dominio/usuario';
import {
  OPCION_CONTENIDO_IGUAL,
  OpcionRecepcion,
  ResultadoRecepcionBolsin,
} from './recepcion-bolsin.modelos';


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

type BolsinCompleto = Prisma.BolsinGetPayload<{
  include: typeof bolsinCompletoInclude;
}>;
type EmpleadoConComision = Prisma.EmpleadoGetPayload<{
  include: { comisionMedica: true };
}>;

/**
 * Clase Control/Gestor del análisis. Coordina exactamente el flujo normal y
 * mantiene las decisiones de negocio fuera del controlador HTTP.
 */
@Injectable()
export class GestorRegistrarRecepcionBolsin {
  private readonly logger = new Logger(GestorRegistrarRecepcionBolsin.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Inicia el CU obteniendo usuario, comisión y bolsines enviados a destino. */
  async nuevaRecepcionBolsin(sesionId: number) {
    const empleado = await this.buscarUsuarioLogueado(sesionId);
    const comision = this.buscarComisionMedicaUsuario(empleado);
    const bolsines = await this.buscarBolsinEnviadoCMUsuario(comision.id);

    return {
      usuarioLogueado: {
        id: empleado.id,
    
      },
      comisionMedica: { id: comision.id, nombre: comision.getNombre() },
      bolsines: bolsines.map((bolsin) => ({
        id: bolsin.id,
        numeroPrecinto: bolsin.numeroPrecinto,

        comisionMedicaOrigen: bolsin.comisionMedicaOrigen,
      })),
    };
  }

  /** El Empleado es el experto que conoce su propia ComisionMedica. */
  buscarComisionMedicaUsuario(empleado: Empleado): ComisionMedica {
    return empleado.getComisionMedica();
  }

  /**
   * El identificador de sesión es un parámetro técnico requerido por una API
   * web sin autenticación; la navegación Sesion -> Usuario -> Empleado es la
   * misma indicada en la secuencia.
   */
  async buscarUsuarioLogueado(sesionId: number): Promise<Empleado> {
    const registro = await this.prisma.sesion.findUnique({
      where: { id: sesionId },
      include: {
        usuario: {
          include: { empleado: { include: { comisionMedica: true } } },
        },
      },
    });
    if (!registro) {
      throw new NotFoundException('No se encontró la sesión indicada.');
    }

    const empleado = this.mapearEmpleado(registro.usuario.empleado);
    const sesion = new Sesion(
      registro.id,
      new Usuario(registro.usuario.id, empleado),
    );
    return sesion.getUsuarioLogueado().getEmpleado();
  }

  /** Consulta únicamente bolsines cuyo cambio actual responde sosEnviado(). */
  async buscarBolsinEnviadoCMUsuario(comisionMedicaId: number) {
    return this.prisma.bolsin.findMany({
      where: {
        comisionMedicaDestinoId: comisionMedicaId,
        cambiosEstado: {
          some: { fechaHoraFin: null, estado: { SosEnviado: true } },
        },
      },
      include: { comisionMedicaOrigen: true },
      orderBy: { fecha: 'asc' },
    });
  }

  validarComisionMedicaBolsin(
    bolsin: Bolsin,
    comisionMedica: ComisionMedica,
  ): boolean {
    return bolsin.obtenerTuCMDestino().id === comisionMedica.id;
  }

  
  buscarPrecintoBolsin(bolsines: Bolsin[]): number[] {
    return bolsines.map((bolsin) => bolsin.getNumeroPrecinto());
  }

  buscarComisionMedicaBolsin(bolsines: Bolsin[]): ComisionMedica[] {
    return bolsines.map((bolsin) => bolsin.obtenerCMOrigen());
  }

  /** Recupera el agregado seleccionado y prepara la información de pantalla. */
  async tomarBolsin(sesionId: number, bolsinId: number) {
    const empleado = await this.buscarUsuarioLogueado(sesionId);
    const comision = this.buscarComisionMedicaUsuario(empleado);
    const registro = await this.prisma.bolsin.findFirst({
      where: { id: bolsinId, comisionMedicaDestinoId: comision.id },
      include: bolsinCompletoInclude,
    });
    if (!registro) {
      throw new NotFoundException('No se encontró el bolsín seleccionado.');
    }

    const bolsin = this.mapearBolsin(registro);
    if (!this.validarComisionMedicaBolsin(bolsin, comision) || !bolsin.sosEnviado()) {
      throw new NotFoundException('El bolsín no está disponible para esta comisión.');
    }
    const remitos = this.buscarRemitoBolsin(bolsin);

    return {
      id: bolsin.id,
      numeroPrecinto: bolsin.getNumeroPrecinto(),
      remitos: remitos.map((remito) => ({
        id: remito.id,
        numero: remito.getNumero(),
        documentaciones: remito.buscarDocumentacion().map((documentacion) => ({
          id: documentacion.id,
          tipo: documentacion.mostrarTipoDocumentacion(),
          asunto: documentacion.getAsunto(),
        })),
      })),
      opciones: [
        {
          codigo: OPCION_CONTENIDO_IGUAL,
          descripcion: 'El contenido del bolsín es igual al registrado.',
        },
      ],
    };
  }

  buscarRemitoBolsin(bolsin: Bolsin): Remito[] {
    return bolsin.buscarRemitoBolsin();
  }

  buscarDocumentacionBolsin(bolsin: Bolsin): Documentacion[] {
    return bolsin.buscarDocumentacionBolsin();
  }

  /** Solo acepta la primera opción porque los flujos alternativos están fuera. */
  tomarOpcion(opcion: OpcionRecepcion): OpcionRecepcion {
    if (opcion !== OPCION_CONTENIDO_IGUAL) {
      throw new BadRequestException('La opción no pertenece al flujo normal implementado.');
    }
    return opcion;
  }

  /**
   * Confirma el CU. $transaction garantiza que ninguna entidad quede en un
   * estado parcial si una escritura inesperada falla.
   */
  async tomarConfirmacion(
    sesionId: number,
    bolsinId: number,
    confirmacion: boolean,
  ): Promise<ResultadoRecepcionBolsin> {
    if (confirmacion !== true) {
      throw new BadRequestException('La confirmación es requerida.');
    }
    const empleado = await this.buscarUsuarioLogueado(sesionId);
    const fechaHora = this.getFechaHoraActual();

    await this.prisma.$transaction(async (tx) => {
      const registro = await tx.bolsin.findUnique({
        where: { id: bolsinId },
        include: bolsinCompletoInclude,
      });
      if (!registro) {
        throw new NotFoundException('No se encontró el bolsín seleccionado.');
      }
      const bolsin = this.mapearBolsin(registro);
      if (!this.validarComisionMedicaBolsin(bolsin, empleado.getComisionMedica())) {
        throw new NotFoundException('El bolsín no pertenece a la comisión del usuario.');
      }

      const estadoRecibido = await this.buscarEstadoRecibidoBolsin(tx);
      const estadoRemito = await this.buscarEstadoRecibidoYAceptado(tx);
      const registroAceptada = await tx.estado.findUnique({
        where: { Nombre_Ambito: { Nombre: 'Aceptada', Ambito: 'DOCUMENTACION' } },
      });
      if (!registroAceptada) {
        throw new NotFoundException('No se configuró el estado Aceptada.');
      }
      const estadoAceptada = this.mapearEstado(registroAceptada);

      await this.registrarCambioEstadoBolsin(
        tx,
        bolsin,
        estadoRecibido,
        empleado,
        fechaHora,
      );
      await this.actualizarEstadoRemito(tx, bolsin, estadoRemito);
      await this.actualizarDocumentacion(
        tx,
        bolsin,
        estadoAceptada,
        empleado,
        fechaHora,
      );
    });

    // La notificación ocurre después del commit para no anunciar una recepción
    // que finalmente pudiera revertirse.
    this.llamarCU29(bolsinId);
    return this.finDelCU(bolsinId, fechaHora);
  }

  async buscarEstadoRecibidoBolsin(tx: Prisma.TransactionClient): Promise<Estado> {
    const registro = await tx.estado.findFirst({
      where: { Nombre: 'Recibido', Ambito: 'BOLSIN', SosAmbitoBolsin: true },
    });
    if (!registro) {
      throw new NotFoundException('No se configuró el estado Recibido del bolsín.');
    }
    const estado = this.mapearEstado(registro);
    if (!estado.sosAmbitoBolsin() || !estado.sosRecibido()) {
      throw new NotFoundException('El estado Recibido no pertenece al ámbito Bolsin.');
    }
    return estado;
  }

  getFechaHoraActual(): Date {
    return new Date();
  }

  async registrarCambioEstadoBolsin(
    tx: Prisma.TransactionClient,
    bolsin: Bolsin,
    estado: Estado,
    empleado: Empleado,
    fechaHora: Date,
  ): Promise<void> {
    // Primero se aplica la regla del dominio y luego se refleja en SQLite.
    bolsin.registrarCambioEstadoBolsin(estado, empleado, fechaHora);
    await tx.cambioEstadoBolsin.updateMany({
      where: { bolsinId: bolsin.id, fechaHoraFin: null },
      data: { fechaHoraFin: fechaHora },
    });
    await tx.cambioEstadoBolsin.create({
      data: {
        bolsinId: bolsin.id,
        estadoId: estado.id,
        empleadoId: empleado.id,
        fechaHoraInicio: fechaHora,
      },
    });
  }

  async buscarEstadoRecibidoYAceptado(
    tx: Prisma.TransactionClient,
  ): Promise<Estado> {
    const registro = await tx.estado.findUnique({
      where: {
        Nombre_Ambito: { Nombre: 'RecibidoYAceptado', Ambito: 'REMITO' },
      },
    });
    if (!registro) {
      throw new NotFoundException('No se configuró RecibidoYAceptado para remitos.');
    }
    const estado = this.mapearEstado(registro);
    if (!estado.sosAmbitoRemito() || !estado.sosRecibidoYAceptado()) {
      throw new NotFoundException('El estado no corresponde a remitos recibidos.');
    }
    return estado;
  }

  async actualizarEstadoRemito(
    tx: Prisma.TransactionClient,
    bolsin: Bolsin,
    estado: Estado,
  ): Promise<void> {
    bolsin.actualizarEstadoRemito(estado);
    await tx.remito.updateMany({
      where: { bolsinId: bolsin.id },
      data: { estadoId: estado.id },
    });
  }

  async actualizarDocumentacion(
    tx: Prisma.TransactionClient,
    bolsin: Bolsin,
    estado: Estado,
    empleado: Empleado,
    fechaHora: Date,
  ): Promise<void> {
    bolsin.actualizarDocumentacion(estado, empleado, fechaHora);
    const documentaciones = bolsin.buscarDocumentacionBolsin();
    for (const documentacion of documentaciones) {
      await tx.cambioEstadoDocumentacion.updateMany({
        where: { documentacionId: documentacion.id, fechaHoraFin: null },
        data: { fechaHoraFin: fechaHora },
      });
      await tx.cambioEstadoDocumentacion.create({
        data: {
          documentacionId: documentacion.id,
          estadoId: estado.id,
          empleadoId: empleado.id,
          fechaHoraInicio: fechaHora,
        },
      });
    }
  }

  /** Punto explícito de integración con el CU 29, no modelado en esta entrega. */
  llamarCU29(bolsinId: number): void {
    this.logger.log(`CU29 solicitado para el bolsín ${bolsinId}.`);
  }

  finDelCU(bolsinId: number, fechaHora: Date): ResultadoRecepcionBolsin {
    return {
      bolsinId,
      estadoBolsin: 'Recibido',
      estadoRemitos: 'RecibidoYAceptado',
      estadoDocumentaciones: 'Aceptada',
      fechaHora: fechaHora.toISOString(),
    };
  }

  private mapearEstado(registro: {
    id: number;
    Nombre: string;
    Ambito: string;
    SosEnviado: boolean;
    SosAmbitoBolsin: boolean;
  }): Estado {
    return new Estado(
      registro.id,
      registro.Nombre,
      registro.Ambito,
 
    );
  }

  private mapearEmpleado(registro: EmpleadoConComision): Empleado {
    return new Empleado(
      registro.id,

      new ComisionMedica(
        registro.comisionMedica.id,
        registro.comisionMedica.nombre,
      ),
    );
  }

  /** Convierte la estructura persistente en las clases puras del dominio. */
  private mapearBolsin(registro: BolsinCompleto): Bolsin {
    const comisionOrigen = new ComisionMedica(
      registro.comisionMedicaOrigen.id,
      registro.comisionMedicaOrigen.nombre,
    );
    const comisionDestino = new ComisionMedica(
      registro.comisionMedicaDestino.id,
      registro.comisionMedicaDestino.nombre,
    );
    const remitos = registro.remitos.map((remito) => {
      const detalles = remito.detalles.map((detalle) => {
        const doc = detalle.documentacion;
        const tipo = new TipoDocumentacion(
          doc.tipoDocumentacion.id,
          doc.tipoDocumentacion.nombre,
        );
        const cambios = doc.cambiosEstado.map(
          (cambio) =>
            new CambioEstadoDocumentacion(
              cambio.id,
              cambio.fechaHoraInicio,
              cambio.fechaHoraFin,
              this.mapearEstado(cambio.estado),
              this.mapearEmpleado(cambio.empleado),
            ),
        );
        // El origen de la documentación se asocia con la comisión de origen del bolsín
        return new DetalleRemito(
          detalle.id,
          new Documentacion(
            doc.id,
            doc.asunto,
            tipo,
            cambios,
            comisionOrigen,
          ),
        );
      });
      return new Remito(
        remito.id,
        remito.Numero,
        this.mapearEstado(remito.estado),
        detalles,
        comisionOrigen,
        comisionDestino,
      );
    });
    const cambios = registro.cambiosEstado.map(
      (cambio) =>
        new CambioEstadoBolsin(
          cambio.id,
          cambio.fechaHoraInicio,
          cambio.fechaHoraFin,
          this.mapearEstado(cambio.estado),
          this.mapearEmpleado(cambio.empleado),
        ),
    );

    return new Bolsin(
      registro.id,
      registro.numeroPrecinto,
      comisionOrigen,
      comisionDestino,
      remitos,
      cambios,

    );
  }
}
