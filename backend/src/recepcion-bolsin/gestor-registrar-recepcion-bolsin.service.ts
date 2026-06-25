import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  AMBITO_DOCUMENTACION,
  AMBITO_REMITO,
  Estado,
  NOMBRE_ESTADO_ACEPTADA,
  NOMBRE_ESTADO_RECIBIDO,
  NOMBRE_ESTADO_RECIBIDO_Y_ACEPTADO,
} from '../dominio/estado';
import { Empleado } from '../dominio/empleado';
import { ComisionMedica } from '../dominio/comisionMedica';
import { Remito } from '../dominio/remito';
import { Documentacion } from '../dominio/documentacion';
import { Bolsin } from '../dominio/bolsin';
import { Sesion } from '../dominio/sesion';
import { Usuario } from '../dominio/usuario';
import {
  OPCION_CONTENIDO_IGUAL,
  OpcionRecepcion,
} from './recepcion-bolsin.modelos';
import { ResultadoRecepcionBolsin } from './resultado-recepcion-bolsin';
import { MANEJADORES_OPCION_RECEPCION } from './opcion-recepcion.handlers';
import { BolsinMapper } from './bolsin.mapper';
import {
  ISesionRepository,
  SESION_REPOSITORY,
} from './repositorios/sesion.repository';
import {
  BOLSIN_REPOSITORY,
  IBolsinRepository,
} from './repositorios/bolsin.repository';
import {
  ESTADO_REPOSITORY,
  IEstadoRepository,
} from './repositorios/estado.repository';

/**
 * Clase Control/Gestor del análisis. Coordina exactamente el flujo normal y
 * mantiene las decisiones de negocio fuera del controlador HTTP.
 *
 * Depende únicamente de abstracciones de repositorio (DIP): no conoce
 * Prisma ni ningún detalle de persistencia, eso queda encapsulado en las
 * implementaciones `Prisma*Repository`.
 */
@Injectable()
export class GestorRegistrarRecepcionBolsin {
  private readonly logger = new Logger(GestorRegistrarRecepcionBolsin.name);

  constructor(
    @Inject(SESION_REPOSITORY)
    private readonly sesionRepository: ISesionRepository,
    @Inject(BOLSIN_REPOSITORY)
    private readonly bolsinRepository: IBolsinRepository,
    @Inject(ESTADO_REPOSITORY)
    private readonly estadoRepository: IEstadoRepository,
    private readonly mapper: BolsinMapper,
  ) {}

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
    const registro = await this.sesionRepository.buscarConUsuarioYEmpleado(
      sesionId,
    );
    if (!registro) {
      throw new NotFoundException('No se encontró la sesión indicada.');
    }

    const empleado = this.mapper.mapearEmpleado(registro.usuario.empleado);
    const sesion = new Sesion(
      registro.id,
      new Usuario(registro.usuario.id, empleado),
    );
    return sesion.getUsuarioLogueado().getEmpleado();
  }

  /** Consulta únicamente bolsines cuyo cambio actual responde sosEnviado(). */
  async buscarBolsinEnviadoCMUsuario(comisionMedicaId: number) {
    return this.bolsinRepository.buscarEnviadosPorComisionDestino(
      comisionMedicaId,
    );
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
    const registro = await this.bolsinRepository.buscarCompletoPorIdYDestino(
      bolsinId,
      comision.id,
    );
    if (!registro) {
      throw new NotFoundException('No se encontró el bolsín seleccionado.');
    }

    const bolsin = this.mapper.mapearBolsin(registro);
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

  /**
   * Despacha por tabla de manejadores (OCP): agregar una opción nueva del
   * flujo alternativo implica registrar una entrada en
   * `MANEJADORES_OPCION_RECEPCION`, no modificar un `if/else` existente acá.
   * Las opciones todavía no implementadas siguen rechazándose igual que antes.
   */
  tomarOpcion(opcion: OpcionRecepcion): OpcionRecepcion {
    const manejador = MANEJADORES_OPCION_RECEPCION[opcion];
    if (!manejador || !manejador.implementado) {
      throw new BadRequestException('La opción no pertenece al flujo normal implementado.');
    }
    return opcion;
  }

  /**
   * Confirma el CU. La transacción garantiza que ninguna entidad quede en un
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

    await this.bolsinRepository.ejecutarEnTransaccion(async (tx) => {
      const registro = await this.bolsinRepository.buscarCompletoPorIdEnTx(
        tx,
        bolsinId,
      );
      if (!registro) {
        throw new NotFoundException('No se encontró el bolsín seleccionado.');
      }
      const bolsin = this.mapper.mapearBolsin(registro);
      if (!this.validarComisionMedicaBolsin(bolsin, empleado.getComisionMedica())) {
        throw new NotFoundException('El bolsín no pertenece a la comisión del usuario.');
      }

      const estadoRecibido = await this.buscarEstadoRecibidoBolsin(tx);
      const estadoRemito = await this.buscarEstadoRecibidoYAceptado(tx);

      await this.registrarCambioEstadoBolsin(
        tx,
        bolsin,
        estadoRecibido,
        empleado,
        fechaHora,
      );
      await this.actualizarEstadoRemito(tx, bolsin, estadoRemito);
      await this.actualizarDocumentacion(tx, bolsin, empleado, fechaHora);
    });

    // La notificación ocurre después del commit para no anunciar una recepción
    // que finalmente pudiera revertirse.
    this.llamarCU29(bolsinId);
    return this.finDelCU(bolsinId, fechaHora);
  }

  async buscarEstadoRecibidoBolsin(tx: unknown): Promise<Estado> {
    const registro = await this.estadoRepository.buscarEstadoBolsinPorNombre(
      tx,
      NOMBRE_ESTADO_RECIBIDO,
    );
    if (!registro) {
      throw new NotFoundException('No se configuró el estado Recibido del bolsín.');
    }
    const estado = this.mapper.mapearEstado(registro);
    if (!estado.sosAmbitoBolsin() || !estado.sosRecibido()) {
      throw new NotFoundException('El estado Recibido no pertenece al ámbito Bolsin.');
    }
    return estado;
  }

  getFechaHoraActual(): Date {
    return new Date();
  }

  async registrarCambioEstadoBolsin(
    tx: unknown,
    bolsin: Bolsin,
    estado: Estado,
    empleado: Empleado,
    fechaHora: Date,
  ): Promise<void> {
    // Primero se aplica la regla del dominio y luego se refleja en SQLite.
    bolsin.registrarCambioEstadoBolsin(estado, empleado, fechaHora);
    await this.bolsinRepository.registrarCambioEstadoBolsin(
      tx,
      bolsin.id,
      estado.id,
      empleado.id,
      fechaHora,
    );
  }

  async buscarEstadoRecibidoYAceptado(tx: unknown): Promise<Estado> {
    const registro = await this.estadoRepository.buscarPorNombreYAmbitoEnTx(
      tx,
      NOMBRE_ESTADO_RECIBIDO_Y_ACEPTADO,
      AMBITO_REMITO,
    );
    if (!registro) {
      throw new NotFoundException('No se configuró RecibidoYAceptado para remitos.');
    }
    const estado = this.mapper.mapearEstado(registro);
    if (!estado.sosAmbitoRemito() || !estado.sosRecibidoYAceptado()) {
      throw new NotFoundException('El estado no corresponde a remitos recibidos.');
    }
    return estado;
  }

  /**
   * Método público de instancia: el test e2e lo mockea con
   * `jest.spyOn(gestor, 'actualizarEstadoRemito')` para forzar un fallo a
   * mitad de la transacción y verificar el rollback. Debe seguir invocándose
   * vía `this.actualizarEstadoRemito(...)` para que el spy intercepte la
   * llamada real.
   */
  async actualizarEstadoRemito(
    tx: unknown,
    bolsin: Bolsin,
    estado: Estado,
  ): Promise<void> {
    bolsin.actualizarEstadoRemito(estado);
    await this.bolsinRepository.actualizarEstadoRemitos(
      tx,
      bolsin.id,
      estado.id,
    );
  }

  async actualizarDocumentacion(
    tx: unknown,
    bolsin: Bolsin,
    empleado: Empleado,
    fechaHora: Date,
  ): Promise<void> {
    const registro = await this.estadoRepository.buscarPorNombreYAmbitoEnTx(
      tx,
      NOMBRE_ESTADO_ACEPTADA,
      AMBITO_DOCUMENTACION,
    );
    if (!registro) {
      throw new NotFoundException('No se configuró el estado Aceptada.');
    }
    const estado = this.mapper.mapearEstado(registro);

    bolsin.actualizarDocumentacion(estado, empleado, fechaHora);
    const documentaciones = bolsin.buscarDocumentacionBolsin();
    for (const documentacion of documentaciones) {
      await this.bolsinRepository.registrarCambioEstadoDocumentacion(
        tx,
        documentacion.id,
        estado.id,
        empleado.id,
        fechaHora,
      );
    }
  }

  /**
   * Punto explícito de integración con el CU 29, no modelado en esta entrega.
   * Método público de instancia: el test e2e lo mockea con
   * `jest.spyOn(gestor, 'llamarCU29')` para verificar que NO se invoca si la
   * transacción de confirmación falla.
   */
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
}
