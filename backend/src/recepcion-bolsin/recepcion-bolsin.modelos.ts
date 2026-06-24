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

export interface ResultadoRecepcionBolsin {
  bolsinId: number;
  estadoBolsin: 'Recibido';
  estadoRemitos: 'RecibidoYAceptado';
  estadoDocumentaciones: 'Aceptada';
  fechaHora: string;
}
