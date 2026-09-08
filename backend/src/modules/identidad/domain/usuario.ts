
import { Empleado } from './empleado';

export class Usuario {
  constructor(
    public readonly id: number,
    private readonly empleado: Empleado,
  ) {}

  getEmpleado(): Empleado {
    return this.empleado;
  }
}