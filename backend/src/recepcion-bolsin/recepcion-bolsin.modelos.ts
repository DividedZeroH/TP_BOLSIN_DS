export const OPCION_CONTENIDO_IGUAL = 'CONTENIDO_IGUAL' as const;
export type OpcionRecepcion = typeof OPCION_CONTENIDO_IGUAL;

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
