
import { ComisionMedica } from './comisionMedica';
export class Empleado {
  constructor(
    public readonly id: number,
    private readonly asignadoA: ComisionMedica,
    public readonly apellido?: string,
    public readonly email?: string,
  ) {}

  getComisionMedica(): ComisionMedica {
    return this.asignadoA;
  }
}
