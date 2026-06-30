import { EstadoRegistro } from './estado.registro';

/** Token de inyección DIP: el servicio depende de esta interfaz, no de Prisma. */
export const ESTADO_REPOSITORY = 'ESTADO_REPOSITORY';

/**
 * Abstracción de acceso al catálogo Estado. El servicio solo conoce esta
 * interfaz; quién la implementa (Prisma, en memoria para tests, etc.) es un
 * detalle de infraestructura (DIP).
 */
export interface IEstadoRepository {
  /** Misma clave natural Nombre+Ambito, dentro de una transacción abierta por el servicio. */
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
  buscarEstadoBolsinPorNombreEnTx(
    tx: unknown,
    nombre: string,
  ): Promise<EstadoRegistro | null>;
}
