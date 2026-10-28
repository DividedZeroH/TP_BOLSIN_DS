import { ComisionMedicaVista, UsuarioLogueadoVista } from '../sesion/sesion.modelos';

export const OPCION_CONTENIDO_IGUAL = 'CONTENIDO_IGUAL' as const;
export const OPCION_FALTA_DOCUMENTACION = 'FALTA_DOCUMENTACION' as const;
export const OPCION_DOCUMENTACION_NO_CORRESPONDE =
  'DOCUMENTACION_NO_CORRESPONDE' as const;
export const OPCION_REDIRIGIR_OTRA_AREA = 'REDIRIGIR_OTRA_AREA' as const;

export type CodigoOpcionRecepcion =
  | typeof OPCION_CONTENIDO_IGUAL
  | typeof OPCION_FALTA_DOCUMENTACION
  | typeof OPCION_DOCUMENTACION_NO_CORRESPONDE
  | typeof OPCION_REDIRIGIR_OTRA_AREA;

export interface OpcionRecepcionVista {
  codigo: CodigoOpcionRecepcion;
  descripcion: string;
  /**
   * Lo informa el backend: las situaciones de flujo alternativo existen en el
   * analisis pero todavia no estan implementadas, y no deben poder
   * confirmarse desde la pantalla.
   */
  implementado: boolean;
}

export interface BolsinVista {
  id: number;
  numeroPrecinto: number;
  comisionMedicaOrigen: ComisionMedicaVista;
}

/** `POST /recepciones-bolsines` (nuevaRecepcionBolsin). */
export interface InicioRecepcion {
  recepcionId: string;
  usuarioLogueado: UsuarioLogueadoVista;
  comisionMedica: ComisionMedicaVista;
}

/** Se carga después de mostrarComisionMedicaUsuario. */
export interface BolsinesParaSeleccion {
  bolsines: BolsinVista[];
}

export interface DocumentacionVista {
  id: number;
  numeroRemito: number;
  tipo: string;
  asunto: string;
}

/** `POST /recepciones-bolsines/:id/bolsin` (tomarBolsin). */
export interface BolsinSeleccionado {
  bolsin: BolsinVista;
  documentacion: DocumentacionVista[];
  opciones: OpcionRecepcionVista[];
}

/** `POST /recepciones-bolsines/:id/opcion` (tomarOpcion -> pedirConfirmacion). */
export interface PedidoConfirmacion {
  confirma: true;
  mensaje: string;
}

/** `POST /recepciones-bolsines/:id/confirmacion` (tomarConfirmacion). */
export interface ResultadoRecepcionBolsin {
  mensaje: string;
  numeroPrecinto: number;
  fechaHora: string;
}

/** El precinto se guarda como entero; en pantalla se muestra como BOL-2026-001. */
export function formatearPrecinto(numeroPrecinto: number): string {
  return `BOL-2026-${String(numeroPrecinto).padStart(3, '0')}`;
}
