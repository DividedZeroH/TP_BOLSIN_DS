import { ComisionMedica } from './comisionMedica';

/**
 * Entidad Empleado del modelo. Es el experto que conoce su propia
 * ComisionMedica (`asignadoA`) y queda registrado como responsable de cada
 * cambio de estado de bolsines y documentación. `apellido` y `email` son
 * opcionales porque algunas reconstrucciones del agregado no los requieren.
 */
export class Empleado {
  constructor(
    public readonly id: number,
    private readonly asignadoA: ComisionMedica,
    public readonly apellido?: string,
    public readonly email?: string,
  ) {}

  /** Devuelve la comisión médica a la que está asignado el empleado. */
  getComisionMedica(): ComisionMedica {
    return this.asignadoA;
  }
}
