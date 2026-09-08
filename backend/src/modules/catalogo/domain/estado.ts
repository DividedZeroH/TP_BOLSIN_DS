
export class Estado {
  constructor(
    public readonly id: number,
    public readonly Nombre: string,
    public readonly Ambito: string,
  
  ) {}

  sosEnviado(): boolean {
    return this.Nombre.toUpperCase() === 'ENVIADO';
  }

  sosAmbitoBolsin(): boolean {
    return this.Ambito.toUpperCase() === 'BOLSIN';
  }

  sosRecibido(): boolean {
    return this.Nombre.toUpperCase() === 'RECIBIDO';
  }

  sosAmbitoRemito(): boolean {
    return this.Ambito.toUpperCase() === 'REMITO';
  }

  sosRecibidoYAceptado(): boolean {
    return this.Nombre.toUpperCase() === 'RECIBIDOYACEPTADO';
  }

  sosAmbitoDocumentacion(): boolean {
    return this.Ambito.toUpperCase() === 'DOCUMENTACION';
  }
}
