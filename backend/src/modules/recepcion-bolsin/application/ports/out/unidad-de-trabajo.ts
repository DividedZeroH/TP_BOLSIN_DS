import { IEstadoRepository } from '../../../../catalogo';
import { IBolsinRepository } from './bolsin.repository';

/** Token de inyección DIP para la unidad de trabajo transaccional. */
export const UNIDAD_DE_TRABAJO = 'UNIDAD_DE_TRABAJO';

/**
 * Repositorios ligados a una misma transacción. El gestor los usa con las
 * mismas interfaces de siempre: no sabe que están transaccionados.
 */
export interface ContextoTransaccional {
  readonly bolsines: IBolsinRepository;
  readonly estados: IEstadoRepository;
}

/**
 * Puerto de salida que resuelve la atomicidad del caso de uso.
 *
 * Reemplaza al antiguo `tx: unknown` que viajaba por todas las firmas: la
 * capa de aplicación pide "hacé esto de forma atómica" y nunca toca un handle
 * de transacción, que es un detalle del motor de persistencia.
 */
export interface IUnidadDeTrabajo {
  ejecutar<T>(
    trabajo: (contexto: ContextoTransaccional) => Promise<T>,
  ): Promise<T>;
}
