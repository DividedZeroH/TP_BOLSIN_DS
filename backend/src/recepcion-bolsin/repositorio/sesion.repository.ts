import { SesionConUsuarioRegistro } from './sesion-con-usuario.registro';

/** Token de inyección DIP para la sesión/usuario/empleado logueado. */
export const SESION_REPOSITORY = 'SESION_REPOSITORY';

/**
 * Abstracción de acceso a Sesion. El servicio navega Sesion -> Usuario ->
 * Empleado sin saber que detrás hay Prisma/SQLite (DIP).
 */
export interface ISesionRepository {
  buscarConUsuarioYEmpleado(
    sesionId: number,
  ): Promise<SesionConUsuarioRegistro | null>;
}
