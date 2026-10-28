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

export const RECEPCIONES_EN_CURSO = Symbol('RECEPCIONES_EN_CURSO');
export interface RecepcionesEnCurso {
  crear(
    datos: Pick<RecepcionEnCurso, 'sesionId' | 'comisionMedica' | 'bolsines'>,
  ): RecepcionEnCurso;
  obtener(id: string): RecepcionEnCurso;
  eliminar(id: string): void;
}
