import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Estado } from '../dominio/estado';
import { Empleado } from '../dominio/empleado';
import { ComisionMedica } from '../dominio/comisionMedica';
import { Remito } from '../dominio/remito';
import { Documentacion } from '../dominio/documentacion';
import { Bolsin } from '../dominio/bolsin';
import { BolsinMapper } from './bolsin.mapper';
import {
  BOLSIN_REPOSITORY,
  IBolsinRepository,
} from './repositorios/bolsin.repository';
import {
  ESTADO_REPOSITORY,
  IEstadoRepository,
} from './repositorios/estado.repository';
import {
  ISesionRepository,
  SESION_REPOSITORY,
} from './repositorios/sesion.repository';
import { MANEJADORES_OPCION_RECEPCION } from './opcion-recepcion.handlers';
import { RecepcionBolsinPresenter } from './recepcion-bolsin.presenter';
import {
  DetalleBolsinVista,
  InicioRecepcionVista,
  OpcionRecepcion,
  ResultadoRecepcionBolsin,
} from './recepcion-bolsin.modelos';

/**
 * Clase Control/Gestor del análisis. Coordina exactamente el flujo normal y
 * mantiene las decisiones de negocio fuera del controlador HTTP. El acceso a
 * datos queda detrás de interfaces de Repository (DIP); este gestor no
 * conoce Prisma ni SQLite.
 */
@Injectable()
export class GestorRegistrarRecepcionBolsin {
  private readonly logger = new Logger(GestorRegistrarRecepcionBolsin.name);

  constructor(
    @Inject(BOLSIN_REPOSITORY) private readonly bolsinRepository: IBolsinRepository,
    @Inject(ESTADO_REPOSITORY) private readonly estadoRepository: IEstadoRepository,
    @Inject(SESION_REPOSITORY) private readonly sesionRepository: ISesionRepository,
    private readonly mapper: BolsinMapper,
    private readonly presenter: RecepcionBolsinPresenter,
  ) {}

  /** Inicia el CU obteniendo usuario, comisión y bolsines enviados a destino. */
  async nuevaRecepcionBolsin(sesionId: number): Promise<InicioRecepcionVista> {
    const empleado = await this.buscarUsuarioLogueado(sesionId);
    const comision = this.buscarComisionMedicaUsuario(empleado);
    const bolsines = await this.buscarBolsinEnviadoCMUsuario(comision.id);

    return this.presenter.presentarInicio(empleado, comision, bolsines);
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
    const registro = await this.sesionRepository.buscarConUsuarioYEmpleado(sesionId);
    if (!registro) {
      throw new NotFoundException('No se encontró la sesión indicada.');
    }
    return this.mapper.mapearEmpleado(registro.usuario.empleado);
  }

  /** Consulta únicamente bolsines cuyo cambio actual responde sosEnviado(). */
  async buscarBolsinEnviadoCMUsuario(comisionMedicaId: number) {
    return this.bolsinRepository.buscarEnviadosPorComisionDestino(comisionMedicaId);
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
  async tomarBolsin(
    sesionId: number,
    bolsinId: number,
  ): Promise<DetalleBolsinVista> {
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

    return this.presenter.presentarDetalle(bolsin);
  }

  buscarRemitoBolsin(bolsin: Bolsin): Remito[] {
    return bolsin.buscarRemitoBolsin();
  }

  buscarDocumentacionBolsin(bolsin: Bolsin): Documentacion[] {
    return bolsin.buscarDocumentacionBolsin();
  }

  /**
   * Punto único de entrada del paso de confirmación: valida la opción elegida
   * (flujo normal) y, recién entonces, ejecuta la confirmación del CU. Permite
   * que el controlador delegue con una sola llamada por endpoint.
   */
  async confirmarRecepcion(
    sesionId: number,
    bolsinId: number,
    opcion: OpcionRecepcion,
    confirmacion: boolean,
  ): Promise<ResultadoRecepcionBolsin> {
    this.tomarOpcion(opcion);
    return this.tomarConfirmacion(sesionId, bolsinId, confirmacion);
  }

  /** Solo acepta la primera opción porque los flujos alternativos están fuera. */
  tomarOpcion(opcion: OpcionRecepcion): OpcionRecepcion {
    const manejador = MANEJADORES_OPCION_RECEPCION[opcion];
    if (!manejador?.implementado) {
      throw new BadRequestException('La opción no pertenece al flujo normal implementado.');
    }
    return manejador.opcion;
  }

  /**
   * Confirma el CU. La transacción la abre el repository (`ejecutarEnTransaccion`)
   * para que ninguna entidad quede en un estado parcial si una escritura
   * inesperada falla.
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
      const registro = await this.bolsinRepository.buscarCompletoPorIdEnTx(tx, bolsinId);
      if (!registro) {
        throw new NotFoundException('No se encontró el bolsín seleccionado.');
      }
      const bolsin = this.mapper.mapearBolsin(registro);
      if (!this.validarComisionMedicaBolsin(bolsin, empleado.getComisionMedica())) {
        throw new NotFoundException('El bolsín no pertenece a la comisión del usuario.');
      }

      const estadoRecibido = await this.buscarEstadoRecibidoBolsin(tx);
      const estadoRemito = await this.buscarEstadoRecibidoYAceptado(tx);
      const estadoAceptada = await this.buscarEstadoAceptadaDocumentacion(tx);

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

  async buscarEstadoRecibidoBolsin(tx: unknown): Promise<Estado> {
    const registro = await this.estadoRepository.buscarEstadoBolsinPorNombreEnTx(tx, 'Recibido');
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
      'RecibidoYAceptado',
      'REMITO',
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

  async buscarEstadoAceptadaDocumentacion(tx: unknown): Promise<Estado> {
    const registro = await this.estadoRepository.buscarPorNombreYAmbitoEnTx(
      tx,
      'Aceptada',
      'DOCUMENTACION',
    );
    if (!registro) {
      throw new NotFoundException('No se configuró el estado Aceptada.');
    }
    return this.mapper.mapearEstado(registro);
  }

  async actualizarEstadoRemito(
    tx: unknown,
    bolsin: Bolsin,
    estado: Estado,
  ): Promise<void> {
    bolsin.actualizarEstadoRemito(estado);
    await this.bolsinRepository.actualizarEstadoRemitos(tx, bolsin.id, estado.id);
  }

  async actualizarDocumentacion(
    tx: unknown,
    bolsin: Bolsin,
    estado: Estado,
    empleado: Empleado,
    fechaHora: Date,
  ): Promise<void> {
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
}
