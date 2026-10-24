export class TipoDocumentacion {
  constructor(
    public readonly id: number,
    public readonly nombre: string,
  ) {}

  getNombre(): string {
    return this.nombre;
  }
}
