import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, IsNull, Repository } from 'typeorm';
import { Estado } from '../catalogo/domain/estado';
import { EstadoService } from '../catalogo/estado.service';
import { Empleado } from '../identidad/domain/empleado';
import { SesionService } from '../identidad/sesion.service';
import { ComisionMedica } from '../organizacion/domain/comision-medica';
import { bolsinADominio, RELACIONES_BOLSIN } from './bolsin.mapper';
import { Bolsin } from './domain/bolsin';
import { Documentacion } from './domain/documentacion';
import { Remito } from './domain/remito';
import {
  BolsinResumenDto,
  BolsinSeleccionadoDto,
  EstadoRecepcionDto,
  InicioRecepcionDto,
  PedidoConfirmacionDto,
  ResultadoRecepcionDto,
} from './dto/respuestas';
import { NotificadorCU29Service } from './notificador-cu29.service';
import {
  CodigoOpcionRecepcion,
  MANEJADORES_OPCION_RECEPCION,
  OPCIONES_RECEPCION,
  OpcionRecepcion,
} from './opciones-recepcion';
import { RecepcionEnCurso, RecepcionEnCursoStore } from './recepcion-en-curso.store';
import { BolsinOrmEntity } from './persistence/bolsin.orm-entity';
import { CambioEstadoBolsinOrmEntity } from './persistence/cambio-estado-bolsin.orm-entity';
import { CambioEstadoDocumentacionOrmEntity } from './persistence/cambio-estado-documentacion.orm-entity';
import { RemitoOrmEntity } from './persistence/remito.orm-entity';

/**
 * Clase Control/Gestor del CU28. Tiene un método por mensaje del diagrama de
 * secuencia, en el mismo orden. Los cuatro mensajes que llegan desde la
 * pantalla (`nuevaRecepcionBolsin`, `tomarBolsin`, `tomarOpcion`,
 * `tomarConfirmacion`) son pasos con estado: lo tomado entre uno y otro vive
 * en `RecepcionEnCursoStore`, keyed por `recepcionId`.
 */
@Injectable()
export class GestorRegistrarRecepcionBolsin {
  constructor(
    @InjectRepository(BolsinOrmEntity)
    private readonly bolsinRepository: Repository<BolsinOrmEntity>,
    private readonly dataSource: DataSource,
    private readonly sesionService: SesionService,
    private readonly estadoService: EstadoService,
    private readonly recepciones: RecepcionEnCursoStore,
    private readonly notificador: NotificadorCU29Service,
  ) {}

  // ---------------------------------------------------------------------------
  // nuevaRecepcionBolsin()
  // ---------------------------------------------------------------------------

  async nuevaRecepcionBolsin(sesionId: number): Promise<InicioRecepcionDto> {
    const empleado = await this.buscarUsuarioLogueado(sesionId);
    const comision = this.buscarComisionMedicaUsuario(empleado);
    const candidatos = await this.buscarBolsinEnviadoCMUsuario(comision);

    // LoopBolsin de la secuencia: cada bolsín responde por sí mismo (Expert).
    const bolsines = candidatos.filter(
      (bolsin) => bolsin.sosEnviado() && this.validarComisionMedicaBolsin(bolsin, comision),
    );
    const precintos = this.buscarPrecintoBolsin(bolsines);
    const origenes = this.buscarComisionMedicaBolsin(bolsines);

    const recepcion = this.recepciones.crear({ sesionId, comisionMedica: comision, bolsines });
    return {
      recepcionId: recepcion.id,
      usuarioLogueado: { id: empleado.id, apellido: empleado.apellido, email: empleado.email },
      comisionMedica: { id: comision.id, nombre: comision.getNombre() },
      bolsines: bolsines.map((bolsin, i) => ({
        id: bolsin.id,
        numeroPrecinto: precintos[i],
        comisionMedicaOrigen: { id: origenes[i].id, nombre: origenes[i].getNombre() },
      })),
    };
  }

  /**
   * El id de sesión es un parámetro técnico (no hay autenticación); la
   * navegación Sesion -> Usuario -> Empleado es la de la secuencia.
   */
  async buscarUsuarioLogueado(sesionId: number): Promise<Empleado> {
    const sesion = await this.sesionService.buscarSesion(sesionId);
    return sesion.getUsuarioLogueado().getEmpleado();
  }

  buscarComisionMedicaUsuario(empleado: Empleado): ComisionMedica {
    return empleado.getComisionMedica();
  }

  /** Trae los bolsines con destino a la comisión; `sosEnviado()` lo decide el loop. */
  async buscarBolsinEnviadoCMUsuario(comision: ComisionMedica): Promise<Bolsin[]> {
    const bolsines = await this.bolsinRepository.find({
      where: { cmDestinoId: comision.id },
      relations: RELACIONES_BOLSIN,
      order: { numeroPrecinto: 'ASC' },
    });
    return bolsines.map(bolsinADominio);
  }

  validarComisionMedicaBolsin(bolsin: Bolsin, comision: ComisionMedica): boolean {
    return bolsin.obtenerTuCMDestino().id === comision.id;
  }

  buscarPrecintoBolsin(bolsines: Bolsin[]): number[] {
    return bolsines.map((bolsin) => bolsin.getNumeroPrecinto());
  }

  buscarComisionMedicaBolsin(bolsines: Bolsin[]): ComisionMedica[] {
    return bolsines.map((bolsin) => bolsin.obtenerCMOrigen());
  }

  // ---------------------------------------------------------------------------
  // tomarBolsin()
  // ---------------------------------------------------------------------------

  /** Se puede volver a elegir otro bolsín; eso descarta la opción tomada. */
  tomarBolsin(recepcionId: string, numeroPrecinto: number): BolsinSeleccionadoDto {
    const recepcion = this.recepciones.obtener(recepcionId);
    const bolsin = recepcion.bolsines.find((b) => b.getNumeroPrecinto() === numeroPrecinto);
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
      documentacion: documentaciones.map((documentacion) => ({
        id: documentacion.id,
        numeroRemito: this.remitoDe(remitos, documentacion).getNumero(),
        tipo: documentacion.mostrarTipoDocumentacion(),
        asunto: documentacion.getAsunto(),
      })),
      opciones: OPCIONES_RECEPCION.map((codigo) => MANEJADORES_OPCION_RECEPCION[codigo]),
    };
  }

  buscarRemitoBolsin(bolsin: Bolsin): Remito[] {
    return bolsin.buscarRemitoBolsin();
  }

  buscarDocumentacionBolsin(bolsin: Bolsin): Documentacion[] {
    return bolsin.buscarDocumentacionBolsin();
  }

  // ---------------------------------------------------------------------------
  // tomarOpcion()
  // ---------------------------------------------------------------------------

  /** Solo `CONTENIDO_IGUAL` está implementada; las otras tres se rechazan. */
  tomarOpcion(recepcionId: string, codigo: CodigoOpcionRecepcion): PedidoConfirmacionDto {
    const recepcion = this.recepciones.obtener(recepcionId);
    this.exigirBolsinSeleccionado(recepcion);
    const opcion: OpcionRecepcion | undefined = MANEJADORES_OPCION_RECEPCION[codigo];
    if (!opcion?.implementado) {
      throw new BadRequestException('La opción no pertenece al flujo normal implementado.');
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
    const numeroPrecinto = this.exigirBolsinSeleccionado(recepcion);
    if (recepcion.paso !== 'OPCION_SELECCIONADA') {
      throw new BadRequestException('No hay opción de recepción seleccionada.');
    }
    const empleado = await this.buscarUsuarioLogueado(recepcion.sesionId);
    const fechaHora = this.getFechaHoraActual();

    const bolsin = await this.dataSource.transaction(async (manager) => {
      const bolsin = await this.buscarBolsinParaRecibir(manager, numeroPrecinto, empleado);

      const estadoRecibido = await this.buscarEstadoRecibidoBolsin(manager);
      await this.registrarCambioEstadoBolsin(manager, bolsin, estadoRecibido, empleado, fechaHora);

      const estados = await this.buscarEstadosRecibidoYAceptado(manager);
      await this.actualizarEstadoRemito(manager, bolsin, estados.remito);
      await this.actualizarDocumentacion(
        manager,
        bolsin,
        estados.documentacion,
        empleado,
        fechaHora,
      );
      return bolsin;
    });

    // Después del commit, para no anunciar una recepción que pudo revertirse.
    this.llamarCU29(bolsin);
    return this.finDelCU(recepcion, bolsin, fechaHora);
  }

  async buscarEstadoRecibidoBolsin(manager: EntityManager): Promise<Estado> {
    const estado = await this.estadoService.buscarPorNombreYAmbito('Recibido', 'BOLSIN', manager);
    if (!estado?.sosAmbitoBolsin() || !estado.sosRecibido()) {
      throw new NotFoundException('No está configurado el estado Recibido del bolsín.');
    }
    return estado;
  }

  getFechaHoraActual(): Date {
    return new Date();
  }

  /** Primero la regla del dominio, después la persistencia del agregado. */
  async registrarCambioEstadoBolsin(
    manager: EntityManager,
    bolsin: Bolsin,
    estado: Estado,
    empleado: Empleado,
    fechaHora: Date,
  ): Promise<void> {
    bolsin.registrarCambioEstadoBolsin(estado, empleado, fechaHora);
    for (const cambio of bolsin.getCambiosEstado()) {
      if (cambio.id === null) {
        await manager.insert(CambioEstadoBolsinOrmEntity, {
          bolsinId: bolsin.id,
          estadoId: cambio.estado.id,
          responsableId: cambio.responsable.id,
          fechaHoraInicio: cambio.fechaHoraInicio,
          fechaHoraFin: cambio.fechaHoraFin,
        });
      } else if (cambio.fechaHoraFin !== null) {
        await manager.update(
          CambioEstadoBolsinOrmEntity,
          { id: cambio.id, fechaHoraFin: IsNull() },
          { fechaHoraFin: cambio.fechaHoraFin },
        );
      }
    }
  }

  /** Estado del remito (`RecibidoYAceptado`) y de su documentación (`Aceptada`). */
  async buscarEstadosRecibidoYAceptado(
    manager: EntityManager,
  ): Promise<{ remito: Estado; documentacion: Estado }> {
    const remito = await this.estadoService.buscarPorNombreYAmbito(
      'RecibidoYAceptado',
      'REMITO',
      manager,
    );
    if (!remito?.sosAmbitoRemito() || !remito.sosRecibidoYAceptado()) {
      throw new NotFoundException('No está configurado el estado RecibidoYAceptado del remito.');
    }
    const documentacion = await this.estadoService.buscarPorNombreYAmbito(
      'Aceptada',
      'DOCUMENTACION',
      manager,
    );
    if (!documentacion?.sosAmbitoDocumentacion() || !documentacion.sosAceptada()) {
      throw new NotFoundException('No está configurado el estado Aceptada de la documentación.');
    }
    return { remito, documentacion };
  }

  async actualizarEstadoRemito(
    manager: EntityManager,
    bolsin: Bolsin,
    estado: Estado,
  ): Promise<void> {
    bolsin.actualizarEstadoRemito(estado);
    for (const remito of this.buscarRemitoBolsin(bolsin)) {
      await manager.update(RemitoOrmEntity, { id: remito.id }, { estadoId: remito.getEstado().id });
    }
  }

  async actualizarDocumentacion(
    manager: EntityManager,
    bolsin: Bolsin,
    estado: Estado,
    empleado: Empleado,
    fechaHora: Date,
  ): Promise<void> {
    bolsin.actualizarDocumentacion(estado, empleado, fechaHora);
    for (const documentacion of this.buscarDocumentacionBolsin(bolsin)) {
      for (const cambio of documentacion.getCambiosEstado()) {
        if (cambio.id === null) {
          await manager.insert(CambioEstadoDocumentacionOrmEntity, {
            documentacionId: documentacion.id,
            estadoId: cambio.estado.id,
            responsableId: cambio.responsable.id,
            fechaHoraInicio: cambio.fechaHoraInicio,
            fechaHoraFin: cambio.fechaHoraFin,
          });
        } else if (cambio.fechaHoraFin !== null) {
          await manager.update(
            CambioEstadoDocumentacionOrmEntity,
            { id: cambio.id, fechaHoraFin: IsNull() },
            { fechaHoraFin: cambio.fechaHoraFin },
          );
        }
      }
    }
  }

  /** `<<include>>` CU29. */
  llamarCU29(bolsin: Bolsin): void {
    this.notificador.notificarRecepcionRegistrada(bolsin.getNumeroPrecinto());
  }

  finDelCU(recepcion: RecepcionEnCurso, bolsin: Bolsin, fechaHora: Date): ResultadoRecepcionDto {
    this.recepciones.eliminar(recepcion.id);
    return {
      mensaje: `Se registró la recepción del bolsín con precinto ${bolsin.getNumeroPrecinto()}.`,
      numeroPrecinto: bolsin.getNumeroPrecinto(),
      estadoBolsin: 'Recibido',
      estadoRemitos: 'RecibidoYAceptado',
      estadoDocumentacion: 'Aceptada',
      fechaHora: fechaHora.toISOString(),
    };
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
        nombre: recepcion.comisionMedica.getNombre(),
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

  /**
   * Relee el bolsín dentro de la transacción y lo bloquea, para que dos
   * usuarios no reciban el mismo bolsín a la vez.
   */
  private async buscarBolsinParaRecibir(
    manager: EntityManager,
    numeroPrecinto: number,
    empleado: Empleado,
  ): Promise<Bolsin> {
    await manager.query(`SELECT "id" FROM "bolsin" WHERE "numero_precinto" = $1 FOR UPDATE`, [
      numeroPrecinto,
    ]);
    const registro = await manager.findOne(BolsinOrmEntity, {
      where: { numeroPrecinto },
      relations: RELACIONES_BOLSIN,
    });
    if (!registro) {
      throw new NotFoundException('No se encontró el bolsín seleccionado.');
    }
    const bolsin = bolsinADominio(registro);
    if (!this.validarComisionMedicaBolsin(bolsin, this.buscarComisionMedicaUsuario(empleado))) {
      throw new NotFoundException('El bolsín no pertenece a la comisión del usuario.');
    }
    if (!bolsin.sosEnviado()) {
      throw new BadRequestException('El bolsín ya no está en estado Enviado.');
    }
    return bolsin;
  }

  private resumir(bolsin: Bolsin): BolsinResumenDto {
    const origen = bolsin.obtenerCMOrigen();
    return {
      id: bolsin.id,
      numeroPrecinto: bolsin.getNumeroPrecinto(),
      comisionMedicaOrigen: { id: origen.id, nombre: origen.getNombre() },
    };
  }

  private remitoDe(remitos: Remito[], documentacion: Documentacion): Remito {
    const remito = remitos.find((r) => r.buscarDocumentacion().includes(documentacion));
    if (!remito) {
      throw new Error(`La documentación ${documentacion.id} no pertenece a ningún remito.`);
    }
    return remito;
  }
}
