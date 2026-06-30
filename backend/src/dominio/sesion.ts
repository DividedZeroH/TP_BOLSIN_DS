import { Usuario } from './usuario';

/**
 * Entidad Sesion del modelo. Identifica la sesión activa y da acceso al
 * usuario logueado, punto de entrada de la navegación Sesion -> Usuario ->
 * Empleado que usa el caso de uso.
 */
export class Sesion {
  constructor(
    public readonly id: number,
    private readonly usuario: Usuario,
  ) {}

  /** Devuelve el usuario asociado a la sesión activa. */
  getUsuarioLogueado(): Usuario {
    return this.usuario;
  }
}
