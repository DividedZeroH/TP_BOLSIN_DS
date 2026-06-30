/**
 * Entidad TipoDocumentacion del modelo: catálogo que clasifica una
 * Documentacion (por ejemplo, "Expediente médico" o "Informe complementario").
 */
export class TipoDocumentacion {
  constructor(
    public readonly id: number,
    public readonly nombre: string,
  ) {}

  /** Devuelve el nombre del tipo de documentación. */
  getNombre(): string {
    return this.nombre;
  }
}
