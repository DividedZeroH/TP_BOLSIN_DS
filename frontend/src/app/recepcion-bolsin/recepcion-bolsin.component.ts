import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  BolsinSeleccionado,
  BolsinesParaSeleccion,
  BolsinVista,
  DocumentacionVista,
  formatearPrecinto,
  InicioRecepcion,
  OpcionRecepcionVista,
  PedidoConfirmacion,
  ResultadoRecepcionBolsin,
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

/** Boundary del diagrama; cada método de pantalla conserva su mensaje. */
@Component({
  selector: 'app-recepcion-bolsin',
  imports: [CommonModule],
  templateUrl: './recepcion-bolsin.component.html',
  styleUrl: './recepcion-bolsin.component.css',
})
export class PantallaRegistrarRecepcionBolsin implements OnInit, OnDestroy {
  readonly formatearPrecinto = formatearPrecinto;
  private readonly solicitudes = new Subscription();
  private recepcionFinalizada = false;

  inicio?: InicioRecepcion;
  bolsines: BolsinVista[] = [];
  bolsinSeleccionado?: BolsinVista;
  detalle?: BolsinSeleccionado;
  opcionesRecepcion: OpcionRecepcionVista[] = [];
  opcionSeleccionada?: OpcionRecepcionVista;
  pedidoConfirmacion?: string;
  modal?: ModalRecepcion;
  cargando = true;
  cargandoDetalle = false;
  confirmando = false;
  finalizando = false;
  mensajeCarga?: string;

  constructor(
    private readonly recepcionService: RecepcionBolsinService,
    private readonly router: Router,
    private readonly cambios: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.registrarRecepcionBolsin();
  }

  ngOnDestroy(): void {
    this.solicitudes.unsubscribe();
  }

  get usuarioLogueadoTexto(): string {
    const usuario = this.inicio?.usuarioLogueado;
    return usuario?.email ?? usuario?.apellido ?? '';
  }

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

  registrarRecepcionBolsin(): void {
    this.abrirVentana();
  }

  abrirVentana(): void {
    this.cargando = true;
    this.mensajeCarga = undefined;
    this.limpiarSeleccion();
    this.solicitudes.add(
      this.recepcionService.nuevaRecepcionBolsin().subscribe({
        next: (inicio) => {
          this.mostrarComisionMedicaUsuario(inicio);
          // La comisión ya está en el DOM antes de pedir la búsqueda de bolsines.
          this.cambios.detectChanges();
          this.solicitudes.add(
            this.recepcionService
              .consultarBolsinesParaSeleccion(inicio.recepcionId)
              .subscribe({
                next: (datos) => this.mostrarDatosBolsinesParaSeleccion(datos),
                error: () => this.informarErrorCarga(),
              }),
          );
        },
        error: () => this.informarErrorCarga(),
      }),
    );
  }

  mostrarComisionMedicaUsuario(inicio: InicioRecepcion): void {
    this.inicio = inicio;
  }

  mostrarDatosBolsinesParaSeleccion(datos: BolsinesParaSeleccion): void {
    this.bolsines = datos.bolsines;
    this.cargando = false;
  }

  tomarBolsin(bolsin: BolsinVista): void {
    if (
      !this.inicio ||
      this.cargandoDetalle ||
      this.confirmando ||
      this.modal?.tipo === 'exito'
    )
      return;
    this.bolsinSeleccionado = bolsin;
    this.limpiarDetalle();
    this.cargandoDetalle = true;
    this.solicitudes.add(
      this.recepcionService
        .tomarBolsin(this.inicio.recepcionId, bolsin.numeroPrecinto)
        .subscribe({
          next: (detalle) => {
            this.mostrarDocumentacionBolsin(detalle);
            this.mostrarOpcionesRecepcionParaSeleccion(detalle.opciones);
          },
          error: (error: unknown) => {
            this.cargandoDetalle = false;
            this.mostrarError(
              'No se pudo cargar',
              error,
              'No fue posible consultar el bolsin.',
            );
          },
        }),
    );
  }

  mostrarDocumentacionBolsin(detalle: BolsinSeleccionado): void {
    this.detalle = detalle;
    this.cargandoDetalle = false;
  }

  mostrarOpcionesRecepcionParaSeleccion(opciones: OpcionRecepcionVista[]): void {
    this.opcionesRecepcion = opciones;
  }

  tomarOpcion(opcion: OpcionRecepcionVista): void {
    if (
      !opcion.implementado ||
      !this.inicio ||
      this.confirmando ||
      this.finalizando ||
      this.modal?.tipo === 'exito'
    )
      return;
    this.solicitudes.add(
      this.recepcionService
        .tomarOpcion(this.inicio.recepcionId, opcion.codigo)
        .subscribe({
          next: (pedido) => this.pedirConfirmacion(pedido, opcion),
          error: (error: unknown) =>
            this.mostrarError(
              'Situacion no disponible',
              error,
              'No se pudo tomar la situacion.',
            ),
        }),
    );
  }

  pedirConfirmacion(pedido: PedidoConfirmacion, opcion: OpcionRecepcionVista): void {
    this.opcionSeleccionada = opcion;
    this.pedidoConfirmacion = pedido.mensaje;
  }

  tomarConfirmacion(): void {
    if (
      !this.inicio ||
      !this.opcionSeleccionada?.implementado ||
      this.confirmando ||
      this.finalizando ||
      this.modal?.tipo === 'exito'
    )
      return;
    this.confirmando = true;
    this.solicitudes.add(
      this.recepcionService.tomarConfirmacion(this.inicio.recepcionId).subscribe({
        next: (resultado) => {
          this.confirmando = false;
          this.informarEjecucionExitosa(resultado);
          // El aviso debe verse antes de cerrar el caso y destruir la pantalla.
          this.cambios.detectChanges();
        },
        error: (error: unknown) => {
          this.confirmando = false;
          this.mostrarError(
            'No se pudo confirmar',
            error,
            'No fue posible registrar la recepcion. Intenta nuevamente.',
          );
        },
      }),
    );
  }

  informarEjecucionExitosa(resultado: ResultadoRecepcionBolsin): void {
    this.modal = {
      tipo: 'exito',
      titulo: 'Recepcion registrada',
      mensaje: resultado.mensaje,
    };
  }

  finDelCU(): void {
    if (!this.inicio || this.finalizando) return;
    if (this.recepcionFinalizada) {
      void this.router.navigate(['/panel']);
      return;
    }
    this.finalizando = true;
    const finalizar = () => {
      this.finalizando = false;
      this.recepcionFinalizada = true;
      void this.router.navigate(['/panel']);
    };
    this.solicitudes.add(
      this.recepcionService.finDelCU(this.inicio.recepcionId).subscribe({
        next: finalizar,
        error: (error: unknown) => {
          // Una respuesta de cierre perdida puede reintentarse: 404 significa que ya terminó.
          if ((error as HttpErrorResponse).status === 404) {
            finalizar();
            return;
          }
          this.finalizando = false;
          if (this.modal?.tipo === 'exito') {
            this.modal.mensaje =
              'La recepcion esta registrada. Pulsa Aceptar para cerrar el caso.';
          }
        },
      }),
    );
  }

  cancelarCasoUso(): void {
    this.modal = {
      tipo: 'cancelacion',
      titulo: 'Cancelar caso de uso',
      mensaje: 'Desea confirmar la cancelacion del caso de uso?',
    };
  }

  confirmarCancelacion(): void {
    const volver = () => void this.router.navigate(['/panel']);
    if (!this.inicio) {
      volver();
      return;
    }
    this.solicitudes.add(
      this.recepcionService
        .cancelar(this.inicio.recepcionId)
        .subscribe({ next: volver, error: volver }),
    );
  }

  rechazarCancelacion(): void {
    this.modal = undefined;
  }

  cerrarModal(): void {
    if (this.modal?.tipo === 'exito') {
      this.finDelCU();
      return;
    }
    this.modal = undefined;
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

  private informarErrorCarga(): void {
    this.cargando = false;
    this.mensajeCarga = 'No se pudo cargar la recepcion.';
  }

  private limpiarSeleccion(): void {
    this.bolsinSeleccionado = undefined;
    this.limpiarDetalle();
  }

  private limpiarDetalle(): void {
    this.detalle = undefined;
    this.opcionesRecepcion = [];
    this.opcionSeleccionada = undefined;
    this.pedidoConfirmacion = undefined;
  }

  private mostrarError(titulo: string, error: unknown, generico: string): void {
    const cuerpo = (error as HttpErrorResponse | undefined)?.error as
      { message?: string | string[] } | undefined;
    const mensaje = Array.isArray(cuerpo?.message) ? cuerpo?.message[0] : cuerpo?.message;
    this.modal = { tipo: 'error', titulo, mensaje: mensaje ?? generico };
  }
}
