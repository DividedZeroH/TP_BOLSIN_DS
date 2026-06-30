/**
 * Entidad ComisionMedica del modelo. Identifica una comisión médica que actúa
 * como origen o destino de un bolsín y a la que pertenecen los empleados.
 */
export class ComisionMedica {
  constructor(
    public readonly id: number,
    public readonly nombre: string,
  ) {}

  /** Devuelve el nombre de la comisión médica. */
  getNombre(): string {
    return this.nombre;
  }
}
