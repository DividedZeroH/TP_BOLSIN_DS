import { UsuariosService } from '../../usuarios/service/usuarios.service';
import { EmpleadosService } from '../../empleados/service/empleados.service';
import { ComisionesMedicasService } from '../../comisiones-medicas/service/comisiones-medicas.service';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Estado } from '../../estados/entity/estado.entity';
import { EstadoService } from '../../estados/service/estado.service';
import { Empleado } from '../../empleados/entity/empleado.entity';
import { SesionService } from '../../sesiones/service/sesion.service';
import { ComisionMedica } from '../../comisiones-medicas/entity/comision-medica.entity';
import { Bolsin } from '../../bolsines/entity/bolsin.entity';
import { Remito } from '../../remitos/entity/remito.entity';
import {
  BolsinResumenDto,
  BolsinesParaSeleccionDto,
  BolsinSeleccionadoDto,
  ComisionMedicaDto,
  EstadoRecepcionDto,
  InicioRecepcionDto,
  PedidoConfirmacionDto,
  ResultadoRecepcionDto,
} from './respuestas.dto';
import { NotificadorCU29Service } from './notificador-cu29.service';
import {
  CodigoOpcionRecepcion,
  MANEJADORES_OPCION_RECEPCION,
  OPCIONES_RECEPCION,
  OpcionRecepcion,
} from '../opciones-recepcion';
import {
  RecepcionEnCurso,
  RecepcionesEnCurso,
  RECEPCIONES_EN_CURSO,
} from '../repository/recepciones-en-curso.repository.interface';
import { BolsinesService } from '../../bolsines/service/bolsines.service';
import {
  RemitosService,
  DocumentacionEncontrada,
} from '../../remitos/service/remitos.service';
import { DocumentacionesService } from '../../documentaciones/service/documentaciones.service';
import {
  ContextoTransaccion,
  UnidadDeTrabajo,
  UNIDAD_DE_TRABAJO,
} from '../../../shared/transaction/unidad-de-trabajo.interface';

interface RemitoParaRecepcion {
  remito: Remito;
  numero: number;
}
/**
 * Clase Control/Gestor del CU28. Tiene un método por mensaje del diagrama de
 * secuencia, en el mismo orden. Los cuatro mensajes que llegan desde la
 * pantalla (`nuevaRecepcionBolsin`, `tomarBolsin`, `tomarOpcion`,
 * `tomarConfirmacion`) son pasos con estado: lo tomado entre uno y otro vive
 * en `RecepcionEnCursoRepository`, keyed por `recepcionId`.
 */
@Injectable()
export class GestorRegistrarRecepcionBolsin {
  constructor(
    private readonly bolsinesService: BolsinesService,
    private readonly remitosService: RemitosService,
    private readonly documentacionesService: DocumentacionesService,
    @Inject(UNIDAD_DE_TRABAJO)
    private readonly unidadDeTrabajo: UnidadDeTrabajo,
    private readonly sesionService: SesionService,
    private readonly estadoService: EstadoService,
    private readonly usuariosService: UsuariosService,
    private readonly empleadosService: EmpleadosService,
    private readonly comisionesMedicasService: ComisionesMedicasService,
    @Inject(RECEPCIONES_EN_CURSO)
    private readonly recepciones: RecepcionesEnCurso,
    private readonly notificador: NotificadorCU29Service,
  ) {}
  // ---------------------------------------------------------------------------
  // nuevaRecepcionBolsin()
  // ---------------------------------------------------------------------------
  async nuevaRecepcionBolsin(sesionId: number): Promise<InicioRecepcionDto> {
    const empleado = await this.buscarUsuarioLogueado(sesionId);
    const comision = this.buscarComisionMedicaUsuario(empleado);
    const nombreComision = this.comisionesMedicasService.getNombre(comision);
    const recepcion = this.recepciones.crear({
      sesionId,
      comisionMedica: comision,
      bolsines: [],
    });
    return {
      recepcionId: recepcion.id,
      usuarioLogueado: {
        id: empleado.id,
        apellido: empleado.apellido,
        email: empleado.email,
      },
      comisionMedica: {
        id: comision.id,
        nombre: nombreComision,
      },
    };
  }

  /** Continuación HTTP después de mostrarComisionMedicaUsuario en la pantalla. */
  async consultarBolsinesParaSeleccion(
    recepcionId: string,
  ): Promise<BolsinesParaSeleccionDto> {
    const recepcion = this.recepciones.obtener(recepcionId);
    this.exigirRecepcionSinConfirmar(recepcion);
    if (recepcion.paso !== 'INICIADA') {
      throw new BadRequestException('La selección del bolsín ya está en curso.');
    }
    const bolsines = await this.buscarBolsinEnviadoCMUsuario(recepcion.comisionMedica);
    const precintos = this.buscarPrecintoBolsin(bolsines);
    const origenes = this.buscarComisionMedicaBolsin(bolsines);
    recepcion.bolsines = bolsines;
    return {
      bolsines: bolsines.map((bolsin, i) => ({
        id: bolsin.id,
        numeroPrecinto: precintos[i],
        comisionMedicaOrigen: origenes[i],
      })),
    };
  }
  /**
   * El id de sesión es un parámetro técnico (no hay autenticación); la
   * navegación Sesion -> Usuario -> Empleado es la de la secuencia.
   */
  async buscarUsuarioLogueado(sesionId: number): Promise<Empleado> {
    const sesion = await this.sesionService.buscarSesion(sesionId);
    return this.usuariosService.getEmpleado(
      this.sesionService.getUsuarioLogueado(sesion),
    );
  }
  buscarComisionMedicaUsuario(empleado: Empleado): ComisionMedica {
    return this.empleadosService.getComisionMedica(empleado);
  }
  /** Trae los bolsines con destino a la comisión; `sosEnviado()` lo decide el loop. */
  async buscarBolsinEnviadoCMUsuario(comision: ComisionMedica): Promise<Bolsin[]> {
    const candidatos = await this.bolsinesService.buscarPorDestino(comision.id);
    return candidatos.filter((bolsin) => {
      const enviado = this.bolsinesService.sosEnviado(bolsin);
      const destino = this.bolsinesService.obtenerTuCMDestino(bolsin);
      return this.validarComisionMedicaBolsin(destino, comision) && enviado;
    });
  }
  validarComisionMedicaBolsin(
    destino: ComisionMedica,
    comision: ComisionMedica,
  ): boolean {
    return destino.id === comision.id;
  }
  buscarPrecintoBolsin(bolsines: Bolsin[]): number[] {
    return bolsines.map((bolsin) => this.bolsinesService.getNumeroPrecinto(bolsin));
  }
  buscarComisionMedicaBolsin(bolsines: Bolsin[]): ComisionMedicaDto[] {
    return bolsines.map((bolsin) => {
      const origen = this.bolsinesService.obtenerCMOrigen(bolsin);
      return { id: origen.id, nombre: this.comisionesMedicasService.getNombre(origen) };
    });
  }
  // ---------------------------------------------------------------------------
  // tomarBolsin()
  // ---------------------------------------------------------------------------
  /** Se puede volver a elegir otro bolsín; eso descarta la opción tomada. */
  tomarBolsin(recepcionId: string, numeroPrecinto: number): BolsinSeleccionadoDto {
    const recepcion = this.recepciones.obtener(recepcionId);
    this.exigirRecepcionSinConfirmar(recepcion);
    const bolsin = recepcion.bolsines.find(
      (b) => this.bolsinesService.getNumeroPrecinto(b) === numeroPrecinto,
    );
    if (!bolsin) {
      throw new NotFoundException(
        'El bolsín no está entre los enviados a la comisión del usuario.',
      );
    }
    recepcion.numeroPrecinto = numeroPrecinto;
    recepcion.opcionCodigo = undefined;
    recepcion.paso = 'BOLSIN_SELECCIONADO';
    const remitos = this.buscarRemitoBolsin(bolsin);
    const documentaciones = this.buscarDocumentacionBolsin(bolsin);
    return {
      bolsin: this.resumir(bolsin),
      documentacion: documentaciones.map(({ documentacion, remitoId, tipo, asunto }) => ({
        id: documentacion.id,
        numeroRemito: this.remitoDe(remitos, remitoId).numero,
        tipo,
        asunto,
      })),
      opciones: OPCIONES_RECEPCION.map((codigo) => MANEJADORES_OPCION_RECEPCION[codigo]),
    };
  }
  buscarRemitoBolsin(bolsin: Bolsin): RemitoParaRecepcion[] {
    return this.bolsinesService.buscarRemitoBolsin(bolsin).map((remito) => ({
      remito,
      numero: this.remitosService.getNumero(remito),
    }));
  }
  buscarDocumentacionBolsin(bolsin: Bolsin): DocumentacionEncontrada[] {
    return this.bolsinesService.buscarDocumentacionBolsin(bolsin);
  }
  // ---------------------------------------------------------------------------
  // tomarOpcion()
  // ---------------------------------------------------------------------------
  /** Solo `CONTENIDO_IGUAL` está implementada; las otras tres se rechazan. */
  tomarOpcion(recepcionId: string, codigo: CodigoOpcionRecepcion): PedidoConfirmacionDto {
    const recepcion = this.recepciones.obtener(recepcionId);
    this.exigirRecepcionSinConfirmar(recepcion);
    this.exigirBolsinSeleccionado(recepcion);
    const opcion: OpcionRecepcion | undefined = MANEJADORES_OPCION_RECEPCION[codigo];
    if (!opcion?.implementado) {
      throw new BadRequestException(
        'La opción no pertenece al flujo normal implementado.',
      );
    }
    recepcion.opcionCodigo = opcion.codigo;
    recepcion.paso = 'OPCION_SELECCIONADA';
    return {
      confirma: true,
      mensaje: `¿Confirma la recepción del bolsín con precinto ${recepcion.numeroPrecinto}?`,
    };
  }
  // ---------------------------------------------------------------------------
  // tomarConfirmacion()
  // ---------------------------------------------------------------------------
  /**
   * Toda la escritura ocurre en una transacción: si algo falla, ni el bolsín,
   * ni los remitos, ni la documentación quedan a medio recibir.
   */
  async tomarConfirmacion(recepcionId: string): Promise<ResultadoRecepcionDto> {
    const recepcion = this.recepciones.obtener(recepcionId);
    // Reintentar una respuesta perdida no vuelve a escribir ni a llamar al CU29.
    if (recepcion.resultado) return recepcion.resultado;
    const numeroPrecinto = this.exigirBolsinSeleccionado(recepcion);
    if (recepcion.paso !== 'OPCION_SELECCIONADA') {
      throw new BadRequestException('No hay opción de recepción seleccionada.');
    }
    const empleado = await this.buscarUsuarioLogueado(recepcion.sesionId);
    const { bolsin, fechaHora } = await this.unidadDeTrabajo.ejecutar(
      async (contexto) => {
        const bolsin = await this.buscarBolsinParaRecibir(
          contexto,
          numeroPrecinto,
          empleado,
        );
        const estadoRecibido = await this.buscarEstadoRecibidoBolsin(contexto);
        const fechaHora = this.getFechaHoraActual();
        await this.registrarCambioEstadoBolsin(
          contexto,
          bolsin,
          estadoRecibido,
          empleado,
          fechaHora,
        );
        const estados = await this.buscarEstadosRecibidoYAceptado(contexto);
        await this.actualizarEstadoRemito(contexto, bolsin, estados.remito);
        await this.actualizarDocumentacion(
          contexto,
          bolsin,
          estados.documentacion,
          empleado,
          fechaHora,
        );
        return { bolsin, fechaHora };
      },
    );
    const resultado: ResultadoRecepcionDto = {
      mensaje: `Se registró la recepción del bolsín con precinto ${this.bolsinesService.getNumeroPrecinto(bolsin)}.`,
      numeroPrecinto: this.bolsinesService.getNumeroPrecinto(bolsin),
      estadoBolsin: 'Recibido',
      estadoRemitos: 'RecibidoYAceptado',
      estadoDocumentacion: 'RecibidoYAceptado',
      fechaHora: fechaHora.toISOString(),
    };
    recepcion.resultado = resultado;
    recepcion.paso = 'CONFIRMADA';
    // Después del commit, para no anunciar una recepción que pudo revertirse.
    this.llamarCU29(bolsin);
    return resultado;
  }
  async buscarEstadoRecibidoBolsin(contexto: ContextoTransaccion): Promise<Estado> {
    const estado = await this.estadoService.buscarPorNombreYAmbito(
      'Recibido',
      'BOLSIN',
      contexto,
    );
    if (
      !estado ||
      !this.estadoService.sosAmbitoBolsin(estado) ||
      !this.estadoService.sosRecibido(estado)
    ) {
      throw new NotFoundException('No está configurado el estado Recibido del bolsín.');
    }
    return estado;
  }
  getFechaHoraActual(): Date {
    return new Date();
  }
  /** Primero la lógica del servicio, después la persistencia. */
  async registrarCambioEstadoBolsin(
    contexto: ContextoTransaccion,
    bolsin: Bolsin,
    estado: Estado,
    empleado: Empleado,
    fechaHora: Date,
  ): Promise<void> {
    this.bolsinesService.registrarCambioEstadoBolsin(bolsin, estado, empleado, fechaHora);
    await this.bolsinesService.guardarCambiosEstado(bolsin, contexto);
  }
  /** Ambos ámbitos usan RecibidoYAceptado, como el diagrama de secuencia. */
  async buscarEstadosRecibidoYAceptado(contexto: ContextoTransaccion): Promise<{
    remito: Estado;
    documentacion: Estado;
  }> {
    const remito = await this.estadoService.buscarPorNombreYAmbito(
      'RecibidoYAceptado',
      'REMITO',
      contexto,
    );
    if (!remito || !this.estadoService.sosAmbitoRemito(remito)) {
      throw new NotFoundException(
        'No está configurado el estado RecibidoYAceptado del remito.',
      );
    }
    const documentacion = await this.estadoService.buscarPorNombreYAmbito(
      'RecibidoYAceptado',
      'DOCUMENTACION',
      contexto,
    );
    if (!documentacion || !this.estadoService.sosAmbitoDocumentacion(documentacion)) {
      throw new NotFoundException(
        'No está configurado el estado RecibidoYAceptado de la documentación.',
      );
    }
    if (!this.estadoService.sosRecibidoYAceptado(remito)) {
      throw new NotFoundException('El estado del remito no es RecibidoYAceptado.');
    }
    if (!this.estadoService.sosRecibidoYAceptado(documentacion)) {
      throw new NotFoundException(
        'El estado de la documentación no es RecibidoYAceptado.',
      );
    }
    return { remito, documentacion };
  }
  async actualizarEstadoRemito(
    contexto: ContextoTransaccion,
    bolsin: Bolsin,
    estado: Estado,
  ): Promise<void> {
    this.bolsinesService.actualizarEstadoRemito(bolsin, estado);
    await this.remitosService.guardarEstados(bolsin.remitos, contexto);
  }
  async actualizarDocumentacion(
    contexto: ContextoTransaccion,
    bolsin: Bolsin,
    estado: Estado,
    empleado: Empleado,
    fechaHora: Date,
  ): Promise<void> {
    this.bolsinesService.actualizarDocumentacion(bolsin, estado, empleado, fechaHora);
    await this.documentacionesService.guardarCambiosEstado(
      // Extracción técnica para persistir, sin repetir los mensajes de consulta.
      bolsin.remitos.flatMap((remito) =>
        remito.detalles.map((detalle) => detalle.documentacion),
      ),
      contexto,
    );
  }
  /** `<<include>>` CU29. */
  llamarCU29(bolsin: Bolsin): void {
    this.notificador.notificarRecepcionRegistrada(
      this.bolsinesService.getNumeroPrecinto(bolsin),
    );
  }
  /** La pantalla lo solicita después de informarEjecucionExitosa. */
  finDelCU(recepcionId: string): void {
    const recepcion = this.recepciones.obtener(recepcionId);
    if (recepcion.paso !== 'CONFIRMADA') {
      throw new BadRequestException('La recepción todavía no fue confirmada.');
    }
    this.recepciones.eliminar(recepcion.id);
  }
  // ---------------------------------------------------------------------------
  // Soporte técnico de la pantalla (no son mensajes del diagrama)
  // ---------------------------------------------------------------------------
  consultarRecepcion(recepcionId: string): EstadoRecepcionDto {
    const recepcion = this.recepciones.obtener(recepcionId);
    return {
      recepcionId: recepcion.id,
      paso: recepcion.paso,
      comisionMedica: {
        id: recepcion.comisionMedica.id,
        nombre: this.comisionesMedicasService.getNombre(recepcion.comisionMedica),
      },
      bolsines: recepcion.bolsines.map((bolsin) => this.resumir(bolsin)),
      numeroPrecinto: recepcion.numeroPrecinto,
      opcionCodigo: recepcion.opcionCodigo,
    };
  }
  cancelarRecepcion(recepcionId: string): void {
    this.recepciones.eliminar(recepcionId);
  }
  private exigirBolsinSeleccionado(recepcion: RecepcionEnCurso): number {
    if (recepcion.paso === 'INICIADA' || recepcion.numeroPrecinto === undefined) {
      throw new BadRequestException('No hay bolsín seleccionado.');
    }
    return recepcion.numeroPrecinto;
  }

  private exigirRecepcionSinConfirmar(recepcion: RecepcionEnCurso): void {
    if (recepcion.paso === 'CONFIRMADA') {
      throw new BadRequestException('La recepción ya fue confirmada.');
    }
  }
  /**
   * Valida para que dos usuarios no accedan al mismo bolsin (cumple con ACID (ISOLATION)).
   */
  private async buscarBolsinParaRecibir(
    contexto: ContextoTransaccion,
    numeroPrecinto: number,
    empleado: Empleado,
  ): Promise<Bolsin> {
    const bolsin = await this.bolsinesService.buscarParaActualizar(
      numeroPrecinto,
      contexto,
    );
    if (!bolsin) {
      throw new NotFoundException('No se encontró el bolsín seleccionado.');
    }
    if (
      !this.validarComisionMedicaBolsin(
        this.bolsinesService.obtenerTuCMDestino(bolsin),
        this.buscarComisionMedicaUsuario(empleado),
      )
    ) {
      throw new NotFoundException('El bolsín no pertenece a la comisión del usuario.');
    }
    if (!this.bolsinesService.sosEnviado(bolsin)) {
      throw new BadRequestException('El bolsín ya no está en estado Enviado.');
    }
    return bolsin;
  }
  private resumir(bolsin: Bolsin): BolsinResumenDto {
    const origen = this.bolsinesService.obtenerCMOrigen(bolsin);
    return {
      id: bolsin.id,
      numeroPrecinto: this.bolsinesService.getNumeroPrecinto(bolsin),
      comisionMedicaOrigen: {
        id: origen.id,
        nombre: this.comisionesMedicasService.getNombre(origen),
      },
    };
  }
  private remitoDe(
    remitos: RemitoParaRecepcion[],
    remitoId: number,
  ): RemitoParaRecepcion {
    const remito = remitos.find((r) => r.remito.id === remitoId);
    if (!remito) {
      throw new Error(
        `No se encontró el remito ${remitoId} de la documentación seleccionada.`,
      );
    }
    return remito;
  }
}
