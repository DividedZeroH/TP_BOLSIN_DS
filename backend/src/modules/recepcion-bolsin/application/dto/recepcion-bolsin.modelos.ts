export const OPCION_CONTENIDO_IGUAL = 'CONTENIDO_IGUAL' as const;
export const OPCIONES_RECEPCION = [
  OPCION_CONTENIDO_IGUAL,
  'FALTA_DOCUMENTACION',
  'DOCUMENTACION_NO_CORRESPONDE',
  'REDIRIGIR_OTRA_AREA',
] as const;

export type OpcionRecepcion = (typeof OPCIONES_RECEPCION)[number];

export class ConfirmarRecepcionBolsinDto {
  sesionId!: number;
  opcion!: OpcionRecepcion;
  confirmacion!: boolean;
}

/**
 * Opción de recepción tal como la ve la pantalla. `implementado` es parte del
 * contrato: la UI debe poder mostrar las situaciones del análisis sin ofrecer
 * como confirmables las que el gestor todavía rechaza.
 */
export interface OpcionRecepcionDisponible {
  codigo: OpcionRecepcion;
  descripcion: string;
  implementado: boolean;
}

export interface ComisionMedicaDto {
  id: number;
  nombre: string;
}

export interface UsuarioLogueadoDto {
  id: number;
  apellido?: string;
  email?: string;
}

export interface BolsinResumenDto {
  id: number;
  numeroPrecinto: number;
  comisionMedicaOrigen: ComisionMedicaDto;
}

/** Respuesta de `nuevaRecepcionBolsin()`: lo que muestra la pantalla al abrir. */
export interface InicioRecepcionBolsin {
  usuarioLogueado: UsuarioLogueadoDto;
  comisionMedica: ComisionMedicaDto;
  bolsines: BolsinResumenDto[];
}

export interface DocumentacionDto {
  id: number;
  tipo: string;
  asunto: string;
}

export interface RemitoDto {
  id: number;
  numero: number;
  documentaciones: DocumentacionDto[];
}

/** Respuesta de `tomarBolsin()`: contenido del bolsín y situaciones ofrecidas. */
export interface DetalleBolsinRecepcion {
  id: number;
  numeroPrecinto: number;
  remitos: RemitoDto[];
  opciones: OpcionRecepcionDisponible[];
}

export interface ResultadoRecepcionBolsin {
  bolsinId: number;
  estadoBolsin: 'Recibido';
  estadoRemitos: 'RecibidoYAceptado';
  estadoDocumentaciones: 'Aceptada';
  fechaHora: string;
}
