import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  BolsinSeleccionado,
  BolsinVista,
  DocumentacionVista,
  formatearPrecinto,
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

interface RemitoVista {
  numero: number;
  documentaciones: DocumentacionVista[];
}

/**
 * Pantalla del CU28. Cada acción es un mensaje al gestor del backend sobre la
 * misma recepción en curso (`recepcionId`), en el orden del diagrama de
 * secuencia.
 */
@Component({
  selector: 'app-recepcion-bolsin',
  imports: [CommonModule],
  templateUrl: './recepcion-bolsin.component.html',
  styleUrl: './recepcion-bolsin.component.css',
})
export class RecepcionBolsinComponent implements OnInit {
  readonly formatearPrecinto = formatearPrecinto;

  inicio?: InicioRecepcion;
  bolsines: BolsinVista[] = [];
  bolsinSeleccionado?: BolsinVista;
  detalle?: BolsinSeleccionado;
  opcionSeleccionada?: OpcionRecepcionVista;
  pedidoConfirmacion?: string;
  modal?: ModalRecepcion;
  cargando = true;
  cargandoDetalle = false;
  confirmando = false;
  mensajeCarga?: string;

  constructor(
    private readonly recepcionService: RecepcionBolsinService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.cargarInicio();
  }

  get usuarioLogueadoTexto(): string {
    const usuario = this.inicio?.usuarioLogueado;
    return usuario?.email ?? usuario?.apellido ?? '';
  }

  /**
   * Las situaciones las publica el backend junto con el bolsin tomado,
   * incluyendo cuales estan implementadas. La pantalla no mantiene su propia
   * lista para no poder ofrecer opciones que el gestor va a rechazar.
   */
  get opcionesRecepcion(): OpcionRecepcionVista[] {
    return this.detalle?.opciones ?? [];
  }

  /** La documentacion llega plana (buscarDocumentacionBolsin); se agrupa por remito. */
  get remitos(): RemitoVista[] {
    const remitos = new Map<number, RemitoVista>();
    for (const documentacion of this.detalle?.documentacion ?? []) {
      const remito = remitos.get(documentacion.numeroRemito) ?? {
        numero: documentacion.numeroRemito,
        documentaciones: [],
      };
      remito.documentaciones.push(documentacion);
      remitos.set(remito.numero, remito);
    }
    return [...remitos.values()];
  }

  cargarInicio(): void {
    this.cargando = true;
    this.mensajeCarga = undefined;
    this.limpiarSeleccion();
    this.recepcionService.iniciar().subscribe({
      next: (inicio) => {
        this.inicio = inicio;
        this.bolsines = inicio.bolsines;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        this.mensajeCarga = 'No se pudo cargar la recepcion.';
      },
    });
  }

  seleccionarBolsin(bolsin: BolsinVista): void {
    if (!this.inicio) {
      return;
    }
    this.bolsinSeleccionado = bolsin;
    this.detalle = undefined;
    this.opcionSeleccionada = undefined;
    this.pedidoConfirmacion = undefined;
    this.cargandoDetalle = true;
    this.recepcionService.tomarBolsin(this.inicio.recepcionId, bolsin.numeroPrecinto).subscribe({
      next: (detalle) => {
        this.detalle = detalle;
        this.cargandoDetalle = false;
      },
      error: (error: unknown) => {
        this.cargandoDetalle = false;
        this.mostrarError('No se pudo cargar', error, 'No fue posible consultar el bolsin.');
      },
    });
  }

  seleccionarOpcion(opcion: OpcionRecepcionVista): void {
    if (!opcion.implementado || !this.inicio) {
      return;
    }
    this.recepcionService.tomarOpcion(this.inicio.recepcionId, opcion.codigo).subscribe({
      next: (pedido) => {
        this.opcionSeleccionada = opcion;
        this.pedidoConfirmacion = pedido.mensaje;
      },
      error: (error: unknown) =>
        this.mostrarError('Situacion no disponible', error, 'No se pudo tomar la situacion.'),
    });
  }

  cancelarCasoUso(): void {
    this.modal = {
      tipo: 'cancelacion',
      titulo: 'Cancelar caso de uso',
      mensaje: 'Desea confirmar la cancelacion del caso de uso?',
    };
  }

  /** Descarta la recepcion en el backend y vuelve al panel aunque ya no exista. */
  confirmarCancelacion(): void {
    const volver = () => void this.router.navigate(['/panel']);
    if (!this.inicio) {
      volver();
      return;
    }
    this.recepcionService.cancelar(this.inicio.recepcionId).subscribe({
      next: volver,
      error: volver,
    });
  }

  rechazarCancelacion(): void {
    this.modal = undefined;
  }

  confirmarRecepcion(): void {
    if (!this.inicio || !this.opcionSeleccionada?.implementado) {
      return;
    }
    this.confirmando = true;
    this.recepcionService.confirmar(this.inicio.recepcionId).subscribe({
      next: (resultado) => {
        this.confirmando = false;
        this.modal = { tipo: 'exito', titulo: 'Recepcion registrada', mensaje: resultado.mensaje };
      },
      error: (error: unknown) => {
        this.confirmando = false;
        this.mostrarError(
          'No se pudo confirmar',
          error,
          'No fue posible registrar la recepcion. Intenta nuevamente.',
        );
      },
    });
  }

  /** Tras el exito el backend ya cerro la recepcion: se arranca una nueva. */
  cerrarModal(): void {
    const tipoModal = this.modal?.tipo;
    this.modal = undefined;
    if (tipoModal === 'exito') {
      this.cargarInicio();
    }
  }

  trackByBolsin(_: number, bolsin: BolsinVista): number {
    return bolsin.id;
  }

  trackByRemito(_: number, remito: RemitoVista): number {
    return remito.numero;
  }

  trackByDocumentacion(_: number, documentacion: DocumentacionVista): number {
    return documentacion.id;
  }

  private limpiarSeleccion(): void {
    this.bolsinSeleccionado = undefined;
    this.detalle = undefined;
    this.opcionSeleccionada = undefined;
    this.pedidoConfirmacion = undefined;
  }

  /** Prioriza el mensaje que devuelve el backend (Nest) sobre uno generico. */
  private mostrarError(titulo: string, error: unknown, generico: string): void {
    const cuerpo = (error as HttpErrorResponse | undefined)?.error as
      | { message?: string | string[] }
      | undefined;
    const mensaje = Array.isArray(cuerpo?.message) ? cuerpo?.message[0] : cuerpo?.message;
    this.modal = { tipo: 'error', titulo, mensaje: mensaje ?? generico };
  }
}
