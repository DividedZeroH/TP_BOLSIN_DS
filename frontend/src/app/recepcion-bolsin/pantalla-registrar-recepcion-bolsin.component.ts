import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RecepcionBolsinApiService } from './recepcion-bolsin-api.service';
import {
  BolsinVista,
  ComisionMedicaVista,
  DetalleBolsinVista,
  OpcionRecepcionVista,
  ResultadoRecepcion,
} from './recepcion-bolsin.modelos';

/**
 * Clase Boundary del análisis. Sus operaciones conservan el nombre del
 * diagrama de clases; el template HTML solo presenta y captura la interacción.
 */
@Component({
  selector: 'app-pantalla-registrar-recepcion-bolsin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pantalla-registrar-recepcion-bolsin.component.html',
  styleUrl: './pantalla-registrar-recepcion-bolsin.component.css',
})
export class PantallaRegistrarRecepcionBolsin implements OnInit {
  private readonly sesionId = 1;

  comisionMedica: ComisionMedicaVista | null = null;
  bolsines: BolsinVista[] = [];
  bolsinSeleccionado: BolsinVista | null = null;
  detalleBolsin: DetalleBolsinVista | null = null;
  opciones: OpcionRecepcionVista[] = [];
  opcionSeleccionada: OpcionRecepcionVista | null = null;
  resultado: ResultadoRecepcion | null = null;
  confirmacionPendiente = false;
  cargando = false;
  error = '';

  // TODO: el backend hoy solo devuelve CONTENIDO_IGUAL. Estas 3 son
  // temporales en el frontend para maquetar el paso 7 completo; cuando
  // el backend soporte los otros flujos, esto se borra y vienen las 4
  // directamente de obtenerDetalle().
  private readonly opcionesPendientesBackend: OpcionRecepcionVista[] = [
    {
      codigo: 'FALTA_DOCUMENTACION',
      descripcion:
        'No se recibe toda la documentación asociada a los remitos que contiene el bolsín.',
    },
    {
      codigo: 'DOCUMENTACION_NO_CORRESPONDE',
      descripcion:
        'Existe documentación que no corresponde al destino (CM del usuario logueado).',
    },
    {
      codigo: 'REDIRIGIR_OTRA_AREA',
      descripcion: 'La documentación se debe redirigir a otra área.',
    },
  ];

  constructor(private readonly api: RecepcionBolsinApiService) {}

  ngOnInit(): void {
    this.registrarRecepcionBolsin();
  }

  registrarRecepcionBolsin(): void {
    this.abrirVentana();
  }

  /** Abre la pantalla y envía nuevaRecepcionBolsin al gestor mediante la API. */
  abrirVentana(): void {
    this.cargando = true;
    this.error = '';
    this.api
      .iniciar(this.sesionId)
      .subscribe({
        next: (inicio) => {
          this.mostrarComisionMedicaUsuario(inicio.comisionMedica);
          this.mostrarDatosBolsinesParaSeleccion(inicio.bolsines);
          this.cargando = false;
        },
        error: () => {
          this.error = 'No fue posible iniciar la recepción.';
          this.cargando = false;
        },
      });
  }

  mostrarComisionMedicaUsuario(comision: ComisionMedicaVista): void {
    this.comisionMedica = comision;
  }

  mostrarDatosBolsinesParaSeleccion(bolsines: BolsinVista[]): void {
    this.bolsines = bolsines;
  }

  /** Registra la selección del EB y solicita remitos y documentación. */
  tomarBolsin(bolsin: BolsinVista): void {
    this.bolsinSeleccionado = bolsin;
    this.resultado = null;
    this.error = '';
    this.cargando = true;
    this.api
      .obtenerDetalle(this.sesionId, bolsin.id)
      .subscribe({
        next: (detalle) => {
          this.mostraDocumentacionBolsin(detalle);
          this.mostrarOpcionesRecepcionParaSeleccion(detalle.opciones);
          this.cargando = false;
        },
        error: () => {
          this.error = 'No fue posible obtener el bolsín.';
          this.cargando = false;
        },
      });
  }

  // Se conserva "mostra" porque el diagrama de clases fue definido como
  // fuente canónica frente a la variante de la secuencia.
  mostraDocumentacionBolsin(detalle: DetalleBolsinVista): void {
    this.detalleBolsin = detalle;
  }

  mostrarOpcionesRecepcionParaSeleccion(
    opciones: OpcionRecepcionVista[],
  ): void {
    this.opciones = [...opciones, ...this.opcionesPendientesBackend];
  }

  tomarOpcion(opcion: OpcionRecepcionVista): void {
    this.opcionSeleccionada = opcion;
    this.pedirConfirmacion();
  }

  get opcionesVisibles(): OpcionRecepcionVista[] {
    return this.opcionSeleccionada ? [this.opcionSeleccionada] : this.opciones;
  }

  pedirConfirmacion(): void {
    this.confirmacionPendiente = true;
  }

  /**
   * Envía la única confirmación afirmativa del flujo normal. No se modela la
   * cancelación porque pertenece a los flujos excluidos por alcance.
   */
  tomarConfirmacion(): void {
    if (!this.bolsinSeleccionado || !this.opcionSeleccionada) return;

    this.confirmacionPendiente = false;
    this.cargando = true;
    this.error = '';
    this.api
      .confirmar(this.sesionId, this.bolsinSeleccionado.id)
      .subscribe({
        next: (resultado) => {
          this.resultado = resultado;
          this.cargando = false;
        },
        error: () => {
          this.error = 'No fue posible registrar la recepción.';
          this.cargando = false;
        },
      });
  }
}