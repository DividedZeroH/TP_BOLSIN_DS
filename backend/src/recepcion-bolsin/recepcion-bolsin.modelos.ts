// Modelos de entrada/salida del CU: códigos de opción, DTO de la petición de
// confirmación y resultado del caso de uso. Los ViewModels de pantalla están
// más abajo y los construye el Presenter.

/** Opción del flujo normal (la única implementada). */
export const OPCION_CONTENIDO_IGUAL = 'CONTENIDO_IGUAL' as const;

/** Las cuatro opciones posibles del CU; solo la primera tiene implementación. */
export const OPCIONES_RECEPCION = [
  OPCION_CONTENIDO_IGUAL,
  'FALTA_DOCUMENTACION',
  'DOCUMENTACION_NO_CORRESPONDE',
  'REDIRIGIR_OTRA_AREA',
] as const;

/** Unión de los códigos de opción válidos. */
export type OpcionRecepcion = (typeof OPCIONES_RECEPCION)[number];

/** Cuerpo de la petición POST de confirmación de recepción. */
export class ConfirmarRecepcionBolsinDto {
  sesionId!: number;
  opcion!: OpcionRecepcion;
  confirmacion!: boolean;
}

/** Resultado del CU: estados finales del bolsín, remitos y documentación. */
export interface ResultadoRecepcionBolsin {
  bolsinId: number;
  estadoBolsin: 'Recibido';
  estadoRemitos: 'RecibidoYAceptado';
  estadoDocumentaciones: 'Aceptada';
  fechaHora: string;
}

// Objetos de presentación (ViewModels): forma de las respuestas que consume la
// pantalla. Viven fuera del Gestor; el RecepcionBolsinPresenter los construye.
export interface UsuarioLogueadoVista {
  id: number;
  apellido?: string;
  email?: string;
}

export interface ComisionMedicaVista {
  id: number;
  nombre: string;
}

export interface BolsinResumenVista {
  id: number;
  numeroPrecinto: number;
  comisionMedicaOrigen: ComisionMedicaVista;
}

export interface InicioRecepcionVista {
  usuarioLogueado: UsuarioLogueadoVista;
  comisionMedica: ComisionMedicaVista;
  bolsines: BolsinResumenVista[];
}

export interface OpcionRecepcionVista {
  codigo: OpcionRecepcion;
  descripcion: string;
}

export interface DocumentacionVista {
  id: number;
  tipo: string;
  asunto: string;
}

export interface RemitoVista {
  id: number;
  numero: number;
  documentaciones: DocumentacionVista[];
}

export interface DetalleBolsinVista {
  id: number;
  numeroPrecinto: number;
  remitos: RemitoVista[];
  opciones: OpcionRecepcionVista[];
}
