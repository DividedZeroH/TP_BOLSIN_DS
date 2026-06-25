/**
 * Nombres y ámbitos del catálogo de Estado. Centralizados aquí para que
 * tanto los predicados sos...() como cualquier consulta externa (gestor,
 * repositorios) comparen siempre contra el mismo literal.
 */
export const NOMBRE_ESTADO_ENVIADO = 'Enviado';
export const NOMBRE_ESTADO_RECIBIDO = 'Recibido';
export const NOMBRE_ESTADO_RECIBIDO_Y_ACEPTADO = 'RecibidoYAceptado';
export const NOMBRE_ESTADO_ACEPTADA = 'Aceptada';

export const AMBITO_BOLSIN = 'BOLSIN';
export const AMBITO_REMITO = 'REMITO';
export const AMBITO_DOCUMENTACION = 'DOCUMENTACION';

export class Estado {
  constructor(
    public readonly id: number,
    public readonly Nombre: string,
    public readonly Ambito: string,
  ) {}

  sosEnviado(): boolean {
    return this.Nombre.toUpperCase() === NOMBRE_ESTADO_ENVIADO.toUpperCase();
  }

  sosAmbitoBolsin(): boolean {
    return this.Ambito.toUpperCase() === AMBITO_BOLSIN;
  }

  sosRecibido(): boolean {
    return this.Nombre.toUpperCase() === NOMBRE_ESTADO_RECIBIDO.toUpperCase();
  }

  sosAmbitoRemito(): boolean {
    return this.Ambito.toUpperCase() === AMBITO_REMITO;
  }

  sosRecibidoYAceptado(): boolean {
    return this.Nombre.toUpperCase() === NOMBRE_ESTADO_RECIBIDO_Y_ACEPTADO.toUpperCase();
  }

  sosAmbitoDocumentacion(): boolean {
    return this.Ambito.toUpperCase() === AMBITO_DOCUMENTACION;
  }
}
