
import { ComisionMedica } from './comisionMedica';
export class Empleado {
  constructor(
    public readonly id: number,
    private readonly asignadoA: ComisionMedica,
  ) {}

  getComisionMedica(): ComisionMedica {
    return this.asignadoA;
  }
}
