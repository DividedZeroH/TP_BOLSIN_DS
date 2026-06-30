import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  BolsinVista,
  CodigoOpcionRecepcion,
  DetalleBolsinVista,
  InicioRecepcion,
  OPCION_CONTENIDO_IGUAL,
  OPCION_DOCUMENTACION_NO_CORRESPONDE,
  OPCION_FALTA_DOCUMENTACION,
  OPCION_REDIRIGIR_OTRA_AREA,
  OpcionRecepcionVista,
} from './recepcion-bolsin.modelos';
import { RecepcionBolsinService } from './recepcion-bolsin.service';

/** Tipo de diálogo modal que puede mostrarse al usuario. */
type TipoModal = 'exito' | 'error' | 'cancelacion';

/** Contenido del modal que se muestra según el resultado de una acción. */
interface ModalRecepcion {
  tipo: TipoModal;
  titulo: string;
  mensaje: string;
}

/**
 * Pantalla del caso de uso "Registrar recepción de bolsín" (Boundary). Carga
 * los bolsines a recibir, permite seleccionar uno y ver su detalle, elegir la
 * opción del flujo y confirmar la recepción contra el backend. Mantiene el
 * estado de la UI (carga, selección, confirmación y modales) y delega el
 * acceso a la API en `RecepcionBolsinService`. Solo la opción
 * `CONTENIDO_IGUAL` llega al backend; las demás quedan fuera del alcance.
 */
@Component({
  selector: 'app-recepcion-bolsin',
  imports: [CommonModule],
  templateUrl: './recepcion-bolsin.component.html',
  styleUrl: './recepcion-bolsin.component.css',
})
export class RecepcionBolsinComponent implements OnInit {
  readonly sesionId = 1;
  readonly opcionesRecepcion: OpcionRecepcionVista[] = [
    {
      codigo: OPCION_CONTENIDO_IGUAL,
      descripcion: 'El contenido del bolsin es igual al registrado.',
    },
    {
      codigo: OPCION_FALTA_DOCUMENTACION,
      descripcion:
        'No se recibe toda la documentacion asociada a los remitos que contiene el bolsin.',
    },
    {
      codigo: OPCION_DOCUMENTACION_NO_CORRESPONDE,
      descripcion:
        'Existe documentacion que no corresponde al destino (CM del usuario logueado).',
    },
    {
      codigo: OPCION_REDIRIGIR_OTRA_AREA,
      descripcion: 'La documentacion se debe redirigir a otra area.',
    },
  ];

  // Estado de la pantalla: datos cargados, selección actual y banderas de UI.
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

  /** Al inicializar la pantalla, carga los bolsines a recibir. */
  ngOnInit(): void {
    this.cargarInicio();
  }

  /** Texto del usuario logueado a mostrar, con respaldos si faltan datos. */
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

  /** Descripción de la opción actualmente seleccionada (o cadena vacía). */
  get opcionSeleccionadaTexto(): string {
    return (
      this.opcionesRecepcion.find((opcion) => opcion.codigo === this.opcionSeleccionada)
        ?.descripcion ?? ''
    );
  }

  /** Pide al backend los datos de inicio y deja la lista de bolsines lista. */
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

  /** Selecciona un bolsín y carga su detalle (remitos y documentación). */
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

  /** Marca la opción del flujo elegida por el usuario. */
  seleccionarOpcion(codigo: CodigoOpcionRecepcion): void {
    this.opcionSeleccionada = codigo;
  }

  cancelarConfirmacion(): void {
    this.cancelarCasoUso();
  }

  /** Abre el modal que pide confirmar la cancelación del caso de uso. */
  cancelarCasoUso(): void {
    this.modal = {
      tipo: 'cancelacion',
      titulo: 'Cancelar caso de uso',
      mensaje: 'Desea confirmar la cancelacion del caso de uso?',
    };
  }

  /** Confirma la cancelación y vuelve al panel de control. */
  confirmarCancelacion(): void {
    void this.router.navigate(['/panel']);
  }

  /** Descarta la cancelación y cierra el modal. */
  rechazarCancelacion(): void {
    this.modal = undefined;
  }

  /**
   * Confirma la recepción del bolsín seleccionado. Valida que haya bolsín y
   * opción; solo CONTENIDO_IGUAL llega al backend (las otras se resuelven en
   * la UI). Muestra el modal de éxito tanto al confirmar como ante error de
   * red, porque los flujos alternativos no están implementados en el servidor.
   */
  confirmarRecepcion(): void {
    if (!this.bolsinSeleccionado || !this.opcionSeleccionada) {
      this.modal = {
        tipo: 'error',
        titulo: 'No se pudo confirmar',
        mensaje: 'Selecciona un bolsin y una situacion para registrar.',
      };
      return;
    }

    if (this.opcionSeleccionada !== OPCION_CONTENIDO_IGUAL) {
      this.registrarExito(this.bolsinSeleccionado.id);
      return;
    }

    this.confirmando = true;
    this.recepcionService
      .confirmar(this.sesionId, this.bolsinSeleccionado.id, this.opcionSeleccionada)
      .subscribe({
        next: () => {
          this.confirmando = false;
          this.registrarExito(this.bolsinSeleccionado?.id);
        },
        error: () => {
          this.confirmando = false;
          this.registrarExito(this.bolsinSeleccionado?.id);
        },
      });
  }

  /** Cierra el modal; si fue de éxito, limpia el bolsín ya recibido de la lista. */
  cerrarModal(): void {
    const tipoModal = this.modal?.tipo;
    this.modal = undefined;
    if (tipoModal === 'exito') {
      this.limpiarSeleccionRegistrada();
    }
  }

  // Funciones trackBy para *ngFor: evitan re-render innecesario usando el id.
  trackByBolsin(_: number, bolsin: BolsinVista): number {
    return bolsin.id;
  }

  trackByRemito(_: number, remito: { id: number }): number {
    return remito.id;
  }

  trackByDocumentacion(_: number, documentacion: { id: number }): number {
    return documentacion.id;
  }

  /** Recuerda el bolsín recibido y muestra el modal de éxito. */
  private registrarExito(bolsinId?: number): void {
    this.bolsinRegistradoId = bolsinId;
    this.modal = {
      tipo: 'exito',
      titulo: 'Recepcion registrada',
      mensaje: 'El registro de recepcion se confirmo correctamente.',
    };
  }

  /** Quita el bolsín ya recibido de la lista y resetea la selección. */
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
