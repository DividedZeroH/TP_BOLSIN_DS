import { Bolsin } from '../../../domain/bolsin';
import { Documentacion } from '../../../domain/documentacion';
import { Empleado } from '../../../../identidad';
import { Estado } from '../../../../catalogo';

/** Token de inyección DIP para el agregado Bolsin. */
export const BOLSIN_REPOSITORY = 'BOLSIN_REPOSITORY';

/**
 * Puerto de salida del agregado Bolsin.
 *
 * Está definido enteramente en lenguaje de dominio: recibe y devuelve
 * entidades (`Bolsin`, `Estado`, `Empleado`, `Documentacion`), nunca filas ni
 * tipos de Prisma. Reconstruir el agregado desde la base y traducir las
 * órdenes a SQL es responsabilidad del adaptador que lo implemente.
 */
export interface IBolsinRepository {
  /** Bolsines cuyo cambio de estado actual responde `sosEnviado()`. */
  buscarEnviadosPorComisionDestino(comisionMedicaId: number): Promise<Bolsin[]>;

  buscarPorIdYComisionDestino(
    bolsinId: number,
    comisionMedicaDestinoId: number,
  ): Promise<Bolsin | null>;

  buscarPorId(bolsinId: number): Promise<Bolsin | null>;

  /** Cierra el cambio de estado abierto del bolsín y abre uno nuevo. */
  registrarCambioEstadoBolsin(
    bolsin: Bolsin,
    estado: Estado,
    empleado: Empleado,
    fechaHora: Date,
  ): Promise<void>;

  /** Refleja el estado de todos los remitos del bolsín. */
  actualizarEstadoRemitos(bolsin: Bolsin, estado: Estado): Promise<void>;

  /** Cierra el cambio de estado abierto de una documentación y abre uno nuevo. */
  registrarCambioEstadoDocumentacion(
    documentacion: Documentacion,
    estado: Estado,
    empleado: Empleado,
    fechaHora: Date,
  ): Promise<void>;
}
