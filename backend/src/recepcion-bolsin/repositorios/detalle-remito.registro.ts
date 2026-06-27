import { DocumentacionRegistro } from './documentacion.registro';

/** Vincula un Remito con una Documentacion dentro del agregado Bolsin. */
export interface DetalleRemitoRegistro {
  id: number;
  documentacion: DocumentacionRegistro;
}
