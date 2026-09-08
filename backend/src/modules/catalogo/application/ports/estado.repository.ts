import { Estado } from '../../domain/estado';

/** Token de inyección DIP: el gestor depende de esta interfaz, no de Prisma. */
export const ESTADO_REPOSITORY = 'ESTADO_REPOSITORY';

/**
 * Puerto de salida del catálogo Estado. Habla en lenguaje de dominio: devuelve
 * `Estado`, no filas de la base. Tampoco recibe un handle de transacción: la
 * atomicidad se resuelve con el puerto `IUnidadDeTrabajo`, que entrega
 * repositorios ya ligados a la transacción.
 */
export interface IEstadoRepository {
  buscarPorNombreYAmbito(nombre: string, ambito: string): Promise<Estado | null>;

  /** Estado del ámbito Bolsin identificado por su nombre. */
  buscarEstadoBolsinPorNombre(nombre: string): Promise<Estado | null>;
}
