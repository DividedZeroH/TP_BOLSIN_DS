import type { ComisionMedica } from '../../comisiones-medicas/entity/comision-medica.entity';
import type { Bolsin } from '../../bolsines/entity/bolsin.entity';
import type { CodigoOpcionRecepcion } from '../opciones-recepcion';
export type PasoRecepcion =
  'INICIADA' | 'BOLSIN_SELECCIONADO' | 'OPCION_SELECCIONADA' | 'CONFIRMADA';

export interface ResultadoRecepcion {
  mensaje: string;
  numeroPrecinto: number;
  estadoBolsin: string;
  estadoRemitos: string;
  estadoDocumentacion: string;
  fechaHora: string;
}

/**
 * Artefacto técnico, no entidad del diagrama: guarda lo que el gestor fue
 * tomando entre un mensaje y el siguiente de la secuencia. Vive acá y no en
 * campos del gestor porque el gestor es singleton y mezclaría usuarios.
 */
export interface RecepcionEnCurso {
  id: string;
  sesionId: number;
  comisionMedica: ComisionMedica;
  bolsines: Bolsin[];
  numeroPrecinto?: number;
  opcionCodigo?: CodigoOpcionRecepcion;
  resultado?: ResultadoRecepcion;
  paso: PasoRecepcion;
  creadaEn: Date;
}

export const RECEPCIONES_EN_CURSO_REPOSITORY = Symbol('RECEPCIONES_EN_CURSO_REPOSITORY');
export interface RecepcionesEnCursoRepositoryInterface {
  crear(datos: Pick<RecepcionEnCurso, 'sesionId' | 'comisionMedica'>): RecepcionEnCurso;
  /** `undefined` si no existe o venció; qué responder lo decide el servicio. */
  buscar(id: string): RecepcionEnCurso | undefined;
  eliminar(id: string): void;
}
