import { BolsinResumenRegistro } from './bolsin-resumen.registro';
import { BolsinCompletoRegistro } from './bolsin-completo.registro';

/** Token de inyección DIP para el agregado Bolsin. */
export const BOLSIN_REPOSITORY = 'BOLSIN_REPOSITORY';

/**
 * Abstracción del agregado Bolsin. El servicio de aplicación trabaja contra
 * esta interfaz (DIP); `PrismaBolsinRepository` es el único punto que conoce
 * Prisma/SQLite y el include necesario para reconstruir el agregado.
 */
export interface IBolsinRepository {
  buscarEnviadosPorComisionDestino(
    comisionMedicaId: number,
  ): Promise<BolsinResumenRegistro[]>;

  buscarCompletoPorIdYDestino(
    bolsinId: number,
    comisionMedicaDestinoId: number,
  ): Promise<BolsinCompletoRegistro | null>;

  buscarCompletoPorIdEnTx(
    tx: unknown,
    bolsinId: number,
  ): Promise<BolsinCompletoRegistro | null>;

  /** Cierra el cambio de estado abierto del bolsín y abre uno nuevo. */
  registrarCambioEstadoBolsin(
    tx: unknown,
    bolsinId: number,
    estadoId: number,
    empleadoId: number,
    fechaHora: Date,
  ): Promise<void>;

  /** Actualiza el estado de todos los remitos del bolsín. */
  actualizarEstadoRemitos(
    tx: unknown,
    bolsinId: number,
    estadoId: number,
  ): Promise<void>;

  /** Cierra el cambio de estado abierto de una documentación y abre uno nuevo. */
  registrarCambioEstadoDocumentacion(
    tx: unknown,
    documentacionId: number,
    estadoId: number,
    empleadoId: number,
    fechaHora: Date,
  ): Promise<void>;

  /** Ejecuta `fn` dentro de una transacción Prisma y devuelve su resultado. */
  ejecutarEnTransaccion<T>(fn: (tx: unknown) => Promise<T>): Promise<T>;
}
