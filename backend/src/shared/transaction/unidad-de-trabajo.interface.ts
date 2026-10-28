/** Identidad opaca: solo la infraestructura conoce la conexión asociada. */
export interface ContextoTransaccion {
  readonly id: symbol;
}

export const UNIDAD_DE_TRABAJO = Symbol('UNIDAD_DE_TRABAJO');

export interface UnidadDeTrabajo {
  ejecutar<T>(operacion: (contexto: ContextoTransaccion) => Promise<T>): Promise<T>;
}
