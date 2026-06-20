/**
 * Catálogo de estados compartido por bolsines, remitos y documentación.
 * Los predicados mantienen literalmente las responsabilidades del diagrama.
 */
export class Estado {
  constructor(
    public readonly id: number,
    public readonly Nombre: string,
    public readonly Ambito: string,
    public readonly SosEnviado: boolean,
    public readonly SosAmbitoBolsin: boolean,
  ) {}

  sosEnviado(): boolean {
    return this.SosEnviado;
  }

  sosAmbitoBolsin(): boolean {
    return this.SosAmbitoBolsin || this.Ambito === 'BOLSIN';
  }

  sosRecibido(): boolean {
    return this.Nombre === 'Recibido en CM destino';
  }

  sosAmbitoRemito(): boolean {
    return this.Ambito === 'REMITO';
  }

  sosRecibidoYAceptado(): boolean {
    return this.Nombre === 'RecibidoYAceptado';
  }

  sosAmbitoDocumentacion(): boolean {
    return this.Ambito === 'DOCUMENTACION';
  }
}
