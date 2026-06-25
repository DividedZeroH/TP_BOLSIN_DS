import { CambioEstadoRegistro } from './cambio-estado.registro';
import { TipoDocumentacionRegistro } from './tipo-documentacion.registro';

/** Estructura plana de una Documentacion con su historial de estados. */
export interface DocumentacionRegistro {
  id: number;
  asunto: string;
  tipoDocumentacion: TipoDocumentacionRegistro;
  cambiosEstado: CambioEstadoRegistro[];
}
