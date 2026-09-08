import { ComisionMedica } from '../../../organizacion';
import { Empleado } from '../../../identidad';
import { Estado } from '../../../catalogo';
import { IEstadoRepository } from '../../../catalogo';
import { ISesionRepository } from '../../../identidad';
import { Bolsin } from '../../domain/bolsin';
import { Documentacion } from '../../domain/documentacion';
import { Remito } from '../../domain/remito';
import {
  EntidadNoEncontradaError,
  OperacionInvalidaError,
} from '../errors/recepcion-bolsin.errors';
import { IRegistrarRecepcionBolsin } from '../ports/in/registrar-recepcion-bolsin.port';
import { IBolsinRepository } from '../ports/out/bolsin.repository';
import { INotificadorRecepcion } from '../ports/out/notificador-recepcion';
import { IUnidadDeTrabajo } from '../ports/out/unidad-de-trabajo';
import { MANEJADORES_OPCION_RECEPCION } from './opcion-recepcion.handlers';
import {
  DetalleBolsinRecepcion,
  InicioRecepcionBolsin,
  OPCIONES_RECEPCION,
  OpcionRecepcion,
  OpcionRecepcionDisponible,
  ResultadoRecepcionBolsin,
} from '../dto/recepcion-bolsin.modelos';

/**
 * Clase Control/Gestor del análisis: implementa el puerto de entrada del CU28.
 *
 * Es el centro del hexágono junto con el dominio, y no depende de ningún
 * framework: sin decoradores de NestJS, sin excepciones HTTP y sin logger.
 * Solo conoce entidades de dominio, puertos y errores propios. El cableado con
 * NestJS ocurre en `recepcion-bolsin.module.ts`, que es el composition root.
 */
export class GestorRegistrarRecepcionBolsin implements IRegistrarRecepcionBolsin {
  constructor(
    private readonly bolsinRepository: IBolsinRepository,
    private readonly sesionRepository: ISesionRepository,
    private readonly unidadDeTrabajo: IUnidadDeTrabajo,
    private readonly notificador: INotificadorRecepcion,
  ) {}

  /** Inicia el CU obteniendo usuario, comisión y bolsines enviados a destino. */
  async nuevaRecepcionBolsin(sesionId: number): Promise<InicioRecepcionBolsin> {
    const empleado = await this.buscarUsuarioLogueado(sesionId);
    const comision = this.buscarComisionMedicaUsuario(empleado);
    const bolsines = await this.buscarBolsinEnviadoCMUsuario(comision.id);

    // Los bolsines llegan como agregados de dominio, así que la validación la
    // responden ellos mismos (Expert), tal como marca el LoopBolsin de la
    // secuencia.
    const validados = bolsines.filter(
      (bolsin) =>
        bolsin.sosEnviado() && this.validarComisionMedicaBolsin(bolsin, comision),
    );
    const precintos = this.buscarPrecintoBolsin(validados);
    const origenes = this.buscarComisionMedicaBolsin(validados);

    return {
      usuarioLogueado: {
        id: empleado.id,
        apellido: empleado.apellido,
        email: empleado.email,
      },
      comisionMedica: { id: comision.id, nombre: comision.getNombre() },
      bolsines: validados.map((bolsin, indice) => ({
        id: bolsin.id,
        numeroPrecinto: precintos[indice],
        comisionMedicaOrigen: {
          id: origenes[indice].id,
          nombre: origenes[indice].getNombre(),
        },
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
    const sesion = await this.sesionRepository.buscarPorId(sesionId);
    if (!sesion) {
      throw new EntidadNoEncontradaError('No se encontró la sesión indicada.');
    }
    return sesion.getUsuarioLogueado().getEmpleado();
  }

  /** Consulta únicamente bolsines cuyo cambio actual responde sosEnviado(). */
  async buscarBolsinEnviadoCMUsuario(comisionMedicaId: number): Promise<Bolsin[]> {
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
  ): Promise<DetalleBolsinRecepcion> {
    const empleado = await this.buscarUsuarioLogueado(sesionId);
    const comision = this.buscarComisionMedicaUsuario(empleado);
    const bolsin = await this.bolsinRepository.buscarPorIdYComisionDestino(
      bolsinId,
      comision.id,
    );
    if (!bolsin) {
      throw new EntidadNoEncontradaError('No se encontró el bolsín seleccionado.');
    }
    if (!this.validarComisionMedicaBolsin(bolsin, comision) || !bolsin.sosEnviado()) {
      throw new EntidadNoEncontradaError(
        'El bolsín no está disponible para esta comisión.',
      );
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
      opciones: this.buscarOpcionesRecepcion(),
    };
  }

  /**
   * Corresponde a `mostrarOpcionesRecepcionParaSeleccion()` de la secuencia.
   * Devuelve las cuatro situaciones del análisis con su marca `implementado`,
   * para que la pantalla muestre el abanico completo pero solo habilite las
   * que `tomarOpcion()` va a aceptar.
   */
  buscarOpcionesRecepcion(): OpcionRecepcionDisponible[] {
    return OPCIONES_RECEPCION.map((codigo) => {
      const manejador = MANEJADORES_OPCION_RECEPCION[codigo];
      return {
        codigo: manejador.opcion,
        descripcion: manejador.descripcion,
        implementado: manejador.implementado,
      };
    });
  }

  buscarRemitoBolsin(bolsin: Bolsin): Remito[] {
    return bolsin.buscarRemitoBolsin();
  }

  buscarDocumentacionBolsin(bolsin: Bolsin): Documentacion[] {
    return bolsin.buscarDocumentacionBolsin();
  }

  /** Solo acepta la primera opción porque los flujos alternativos están fuera. */
  tomarOpcion(opcion: OpcionRecepcion): OpcionRecepcion {
    const manejador = MANEJADORES_OPCION_RECEPCION[opcion];
    if (!manejador?.implementado) {
      throw new OperacionInvalidaError(
        'La opción no pertenece al flujo normal implementado.',
      );
    }
    return manejador.opcion;
  }

  /**
   * Confirma el CU dentro de una unidad de trabajo, para que ninguna entidad
   * quede en un estado parcial si una escritura falla.
   */
  async tomarConfirmacion(
    sesionId: number,
    bolsinId: number,
    confirmacion: boolean,
  ): Promise<ResultadoRecepcionBolsin> {
    if (confirmacion !== true) {
      throw new OperacionInvalidaError('La confirmación es requerida.');
    }
    const empleado = await this.buscarUsuarioLogueado(sesionId);
    const fechaHora = this.getFechaHoraActual();

    await this.unidadDeTrabajo.ejecutar(async ({ bolsines, estados }) => {
      const bolsin = await bolsines.buscarPorId(bolsinId);
      if (!bolsin) {
        throw new EntidadNoEncontradaError('No se encontró el bolsín seleccionado.');
      }
      if (!this.validarComisionMedicaBolsin(bolsin, empleado.getComisionMedica())) {
        throw new EntidadNoEncontradaError(
          'El bolsín no pertenece a la comisión del usuario.',
        );
      }

      const estadoRecibido = await this.buscarEstadoRecibidoBolsin(estados);
      const estadoRemito = await this.buscarEstadoRecibidoYAceptado(estados);
      const estadoAceptada = await this.buscarEstadoAceptadaDocumentacion(estados);

      await this.registrarCambioEstadoBolsin(
        bolsines,
        bolsin,
        estadoRecibido,
        empleado,
        fechaHora,
      );
      await this.actualizarEstadoRemito(bolsines, bolsin, estadoRemito);
      await this.actualizarDocumentacion(
        bolsines,
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

  async buscarEstadoRecibidoBolsin(estados: IEstadoRepository): Promise<Estado> {
    const estado = await estados.buscarEstadoBolsinPorNombre('Recibido');
    if (!estado) {
      throw new EntidadNoEncontradaError(
        'No se configuró el estado Recibido del bolsín.',
      );
    }
    if (!estado.sosAmbitoBolsin() || !estado.sosRecibido()) {
      throw new EntidadNoEncontradaError(
        'El estado Recibido no pertenece al ámbito Bolsin.',
      );
    }
    return estado;
  }

  getFechaHoraActual(): Date {
    return new Date();
  }

  async registrarCambioEstadoBolsin(
    bolsines: IBolsinRepository,
    bolsin: Bolsin,
    estado: Estado,
    empleado: Empleado,
    fechaHora: Date,
  ): Promise<void> {
    // Primero se aplica la regla del dominio y luego se persiste el agregado.
    bolsin.registrarCambioEstadoBolsin(estado, empleado, fechaHora);
    await bolsines.registrarCambioEstadoBolsin(bolsin, estado, empleado, fechaHora);
  }

  async buscarEstadoRecibidoYAceptado(estados: IEstadoRepository): Promise<Estado> {
    const estado = await estados.buscarPorNombreYAmbito(
      'RecibidoYAceptado',
      'REMITO',
    );
    if (!estado) {
      throw new EntidadNoEncontradaError(
        'No se configuró RecibidoYAceptado para remitos.',
      );
    }
    if (!estado.sosAmbitoRemito() || !estado.sosRecibidoYAceptado()) {
      throw new EntidadNoEncontradaError(
        'El estado no corresponde a remitos recibidos.',
      );
    }
    return estado;
  }

  async buscarEstadoAceptadaDocumentacion(
    estados: IEstadoRepository,
  ): Promise<Estado> {
    const estado = await estados.buscarPorNombreYAmbito('Aceptada', 'DOCUMENTACION');
    if (!estado) {
      throw new EntidadNoEncontradaError('No se configuró el estado Aceptada.');
    }
    if (!estado.sosAmbitoDocumentacion() || !estado.sosAceptada()) {
      throw new EntidadNoEncontradaError(
        'El estado Aceptada no pertenece al ámbito Documentacion.',
      );
    }
    return estado;
  }

  async actualizarEstadoRemito(
    bolsines: IBolsinRepository,
    bolsin: Bolsin,
    estado: Estado,
  ): Promise<void> {
    bolsin.actualizarEstadoRemito(estado);
    await bolsines.actualizarEstadoRemitos(bolsin, estado);
  }

  async actualizarDocumentacion(
    bolsines: IBolsinRepository,
    bolsin: Bolsin,
    estado: Estado,
    empleado: Empleado,
    fechaHora: Date,
  ): Promise<void> {
    bolsin.actualizarDocumentacion(estado, empleado, fechaHora);
    for (const documentacion of this.buscarDocumentacionBolsin(bolsin)) {
      await bolsines.registrarCambioEstadoDocumentacion(
        documentacion,
        estado,
        empleado,
        fechaHora,
      );
    }
  }

  /**
   * `<<include>>` al CU29 del diagrama de secuencia. Se resuelve a través de un
   * puerto: el gestor anuncia el hecho y no sabe quién lo escucha.
   */
  llamarCU29(bolsinId: number): void {
    this.notificador.notificarRecepcionRegistrada(bolsinId);
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
