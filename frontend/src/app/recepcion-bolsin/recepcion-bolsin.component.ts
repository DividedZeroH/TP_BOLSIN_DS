import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  BolsinVista,
  CodigoOpcionRecepcion,
  DetalleBolsinVista,
  InicioRecepcion,
  OpcionRecepcionVista,
} from './recepcion-bolsin.modelos';
import { RecepcionBolsinService } from './recepcion-bolsin.service';

type TipoModal = 'exito' | 'error' | 'cancelacion';

interface ModalRecepcion {
  tipo: TipoModal;
  titulo: string;
  mensaje: string;
}

@Component({
  selector: 'app-recepcion-bolsin',
  imports: [CommonModule],
  templateUrl: './recepcion-bolsin.component.html',
  styleUrl: './recepcion-bolsin.component.css',
})
export class RecepcionBolsinComponent implements OnInit {
  readonly sesionId = 1;

  inicio?: InicioRecepcion;
  bolsines: BolsinVista[] = [];
  bolsinSeleccionado?: BolsinVista;
  detalle?: DetalleBolsinVista;
  opcionSeleccionada?: CodigoOpcionRecepcion;
  modal?: ModalRecepcion;
  cargando = true;
  cargandoDetalle = false;
  confirmando = false;
  mensajeCarga?: string;
  private bolsinRegistradoId?: number;

  constructor(
    private readonly recepcionService: RecepcionBolsinService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.cargarInicio();
  }

  get usuarioLogueadoTexto(): string {
    const usuario = this.inicio?.usuarioLogueado;
    if (usuario?.email) {
      return usuario.email;
    }
    if (usuario?.apellido) {
      return usuario.apellido;
    }
    if (usuario?.id === 1 || !usuario) {
      return 'encargado.cordoba@demo.local';
    }
    return 'Usuario logueado';
  }

  /**
   * Las situaciones las publica el backend junto con el detalle del bolsin,
   * incluyendo cuales estan implementadas. La pantalla no mantiene su propia
   * lista para no poder ofrecer opciones que el gestor va a rechazar.
   */
  get opcionesRecepcion(): OpcionRecepcionVista[] {
    return this.detalle?.opciones ?? [];
  }

  get opcionSeleccionadaVista(): OpcionRecepcionVista | undefined {
    return this.opcionesRecepcion.find(
      (opcion) => opcion.codigo === this.opcionSeleccionada,
    );
  }

  get opcionSeleccionadaTexto(): string {
    return this.opcionSeleccionadaVista?.descripcion ?? '';
  }

  cargarInicio(): void {
    this.cargando = true;
    this.mensajeCarga = undefined;
    this.recepcionService.iniciar(this.sesionId).subscribe({
      next: (inicio) => {
        this.inicio = inicio;
        this.bolsines = inicio.bolsines ?? [];
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        this.mensajeCarga = 'No se pudo cargar la recepcion.';
      },
    });
  }

  seleccionarBolsin(bolsin: BolsinVista): void {
    this.bolsinSeleccionado = bolsin;
    this.detalle = undefined;
    this.opcionSeleccionada = undefined;
    this.cargandoDetalle = true;
    this.recepcionService.tomarBolsin(this.sesionId, bolsin.id).subscribe({
      next: (detalle) => {
        this.detalle = detalle;
        this.cargandoDetalle = false;
      },
      error: () => {
        this.cargandoDetalle = false;
        this.modal = {
          tipo: 'error',
          titulo: 'No se pudo cargar',
          mensaje: 'No fue posible consultar el bolsin seleccionado.',
        };
      },
    });
  }

  seleccionarOpcion(opcion: OpcionRecepcionVista): void {
    if (!opcion.implementado) {
      return;
    }
    this.opcionSeleccionada = opcion.codigo;
  }

  cancelarConfirmacion(): void {
    this.cancelarCasoUso();
  }

  cancelarCasoUso(): void {
    this.modal = {
      tipo: 'cancelacion',
      titulo: 'Cancelar caso de uso',
      mensaje: 'Desea confirmar la cancelacion del caso de uso?',
    };
  }

  confirmarCancelacion(): void {
    void this.router.navigate(['/panel']);
  }

  rechazarCancelacion(): void {
    this.modal = undefined;
  }

  confirmarRecepcion(): void {
    const opcion = this.opcionSeleccionadaVista;
    if (!this.bolsinSeleccionado || !opcion) {
      this.modal = {
        tipo: 'error',
        titulo: 'No se pudo confirmar',
        mensaje: 'Selecciona un bolsin y una situacion para registrar.',
      };
      return;
    }

    // Guarda defensiva: el boton ya viene deshabilitado, pero la recepcion no
    // debe darse por registrada si la situacion no tiene flujo implementado.
    if (!opcion.implementado) {
      this.modal = {
        tipo: 'error',
        titulo: 'Situacion no implementada',
        mensaje:
          'Esta situacion corresponde a un flujo alternativo que todavia no esta implementado, por lo que no puede registrarse.',
      };
      return;
    }

    const bolsinId = this.bolsinSeleccionado.id;
    this.confirmando = true;
    this.recepcionService.confirmar(this.sesionId, bolsinId, opcion.codigo).subscribe({
      next: () => {
        this.confirmando = false;
        this.registrarExito(bolsinId);
      },
      error: (error: unknown) => {
        this.confirmando = false;
        this.modal = {
          tipo: 'error',
          titulo: 'No se pudo confirmar',
          mensaje: this.mensajeDeError(error),
        };
      },
    });
  }

  cerrarModal(): void {
    const tipoModal = this.modal?.tipo;
    this.modal = undefined;
    if (tipoModal === 'exito') {
      this.limpiarSeleccionRegistrada();
    }
  }

  trackByBolsin(_: number, bolsin: BolsinVista): number {
    return bolsin.id;
  }

  trackByRemito(_: number, remito: { id: number }): number {
    return remito.id;
  }

  trackByDocumentacion(_: number, documentacion: { id: number }): number {
    return documentacion.id;
  }

  /** Prioriza el mensaje que devuelve el backend (Nest) sobre uno generico. */
  private mensajeDeError(error: unknown): string {
    const cuerpo = (error as HttpErrorResponse | undefined)?.error as
      | { message?: string | string[] }
      | undefined;
    const mensaje = Array.isArray(cuerpo?.message)
      ? cuerpo?.message[0]
      : cuerpo?.message;
    return mensaje ?? 'No fue posible registrar la recepcion. Intenta nuevamente.';
  }

  private registrarExito(bolsinId?: number): void {
    this.bolsinRegistradoId = bolsinId;
    this.modal = {
      tipo: 'exito',
      titulo: 'Recepcion registrada',
      mensaje: 'El registro de recepcion se confirmo correctamente.',
    };
  }

  private limpiarSeleccionRegistrada(): void {
    if (this.bolsinRegistradoId !== undefined) {
      this.bolsines = this.bolsines.filter(
        (bolsin) => bolsin.id !== this.bolsinRegistradoId,
      );
    }
    this.bolsinRegistradoId = undefined;
    this.bolsinSeleccionado = undefined;
    this.detalle = undefined;
    this.opcionSeleccionada = undefined;
  }
}
