
import { ComisionMedica } from '../../organizacion';
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
