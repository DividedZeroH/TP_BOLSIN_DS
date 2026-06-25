import { EstadoRegistro } from './estado.registro';

/** Token de inyección DIP: el gestor depende de esta interfaz, no de Prisma. */
export const ESTADO_REPOSITORY = 'ESTADO_REPOSITORY';

/**
 * Abstracción de acceso al catálogo Estado. El gestor solo conoce esta
 * interfaz; quién la implementa (Prisma, en memoria para tests, etc.) es un
 * detalle de infraestructura (DIP).
 */
export interface IEstadoRepository {
  /** Busca un Estado por su clave natural Nombre+Ambito fuera de una transacción. */
  buscarPorNombreYAmbito(
    nombre: string,
    ambito: string,
  ): Promise<EstadoRegistro | null>;

  /** Misma búsqueda pero dentro de una transacción abierta por el gestor. */
  buscarPorNombreYAmbitoEnTx(
    tx: unknown,
    nombre: string,
    ambito: string,
  ): Promise<EstadoRegistro | null>;

  /**
   * Busca el primer Estado que cumpla Nombre+Ambito y además sea el estado
   * "actual" del ámbito Bolsin (SosAmbitoBolsin = true), usado para validar
   * el estado Recibido del bolsín.
   */
  buscarEstadoBolsinPorNombre(
    tx: unknown,
    nombre: string,
  ): Promise<EstadoRegistro | null>;
}
