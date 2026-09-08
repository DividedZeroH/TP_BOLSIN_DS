import { Sesion } from '../../domain/sesion';

/** Token de inyección DIP para la sesión/usuario/empleado logueado. */
export const SESION_REPOSITORY = 'SESION_REPOSITORY';

/**
 * Puerto de salida de Sesion. Devuelve el agregado de dominio completo para
 * que el gestor navegue `Sesion -> Usuario -> Empleado` con los mensajes del
 * diagrama de secuencia, en vez de recibir una fila ya aplanada.
 */
export interface ISesionRepository {
  buscarPorId(sesionId: number): Promise<Sesion | null>;
}
