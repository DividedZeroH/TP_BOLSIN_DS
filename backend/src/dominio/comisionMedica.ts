/** Entidad del modelo que identifica una comisión médica. */

export class ComisionMedica {
  constructor(
    public readonly id: number,
    public readonly nombre: string,
  ) {}

  getNombre(): string {
    return this.nombre;
  }
}