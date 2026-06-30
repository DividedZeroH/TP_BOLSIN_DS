/**
 * Entidad Estado del modelo de análisis: catálogo común de estados consultado
 * mediante los predicados `sos...()` que aparecen en el diagrama de clases y
 * en el diagrama de secuencia. `Ambito` distingue a qué tipo de objeto aplica
 * el estado (BOLSIN, REMITO o DOCUMENTACION), porque un mismo nombre puede
 * existir en más de un ámbito.
 */
export class Estado {
  constructor(
    public readonly id: number,
    public readonly Nombre: string,
    public readonly Ambito: string,
  ) {}

  /** ¿Es el estado "Enviado"? (bolsín despachado, pendiente de recepción). */
  sosEnviado(): boolean {
    return this.Nombre.toUpperCase() === 'ENVIADO';
  }

  /** ¿Pertenece al ámbito Bolsin? */
  sosAmbitoBolsin(): boolean {
    return this.Ambito.toUpperCase() === 'BOLSIN';
  }

  /** ¿Es el estado "Recibido" del bolsín? */
  sosRecibido(): boolean {
    return this.Nombre.toUpperCase() === 'RECIBIDO';
  }

  /** ¿Pertenece al ámbito Remito? */
  sosAmbitoRemito(): boolean {
    return this.Ambito.toUpperCase() === 'REMITO';
  }

  /** ¿Es el estado "RecibidoYAceptado" de un remito? */
  sosRecibidoYAceptado(): boolean {
    return this.Nombre.toUpperCase() === 'RECIBIDOYACEPTADO';
  }

  /** ¿Pertenece al ámbito Documentacion? */
  sosAmbitoDocumentacion(): boolean {
    return this.Ambito.toUpperCase() === 'DOCUMENTACION';
  }
}
