import { Empleado } from './empleado';

/**
 * Entidad Usuario del modelo. Representa la cuenta con la que un Empleado
 * inicia sesión; la navegación del CU es Sesion -> Usuario -> Empleado.
 */
export class Usuario {
  constructor(
    public readonly id: number,
    private readonly empleado: Empleado,
  ) {}

  /** Devuelve el empleado dueño de este usuario. */
  getEmpleado(): Empleado {
    return this.empleado;
  }
}
