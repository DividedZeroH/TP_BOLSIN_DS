export type AmbitoEstado = 'BOLSIN' | 'REMITO' | 'DOCUMENTACION';

/**
 * Catálogo único de estados. Los predicados `sos...()` son la única forma de
 * preguntar por un estado: nadie compara strings fuera de esta clase (Expert).
 */
export class Estado {
  constructor(
    public readonly id: number,
    public readonly nombre: string,
    public readonly ambito: AmbitoEstado,
  ) {}

  sosEnviado(): boolean {
    return this.nombre === 'Enviado';
  }

  sosRecibido(): boolean {
    return this.nombre === 'Recibido';
  }

  sosRecibidoYAceptado(): boolean {
    return this.nombre === 'RecibidoYAceptado';
  }

  sosAceptada(): boolean {
    return this.nombre === 'Aceptada';
  }

  sosAmbitoBolsin(): boolean {
    return this.ambito === 'BOLSIN';
  }

  sosAmbitoRemito(): boolean {
    return this.ambito === 'REMITO';
  }

  sosAmbitoDocumentacion(): boolean {
    return this.ambito === 'DOCUMENTACION';
  }
}
