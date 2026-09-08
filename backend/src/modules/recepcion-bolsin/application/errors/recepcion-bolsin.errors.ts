/**
 * Errores del caso de uso, expresados en términos de la aplicación y no del
 * transporte.
 *
 * El gestor no debe saber que existe HTTP: traducir estos errores a 404 o 400
 * es responsabilidad del adaptador de entrada. Si mañana el CU se expone por
 * CLI o por una cola, el núcleo no cambia.
 */
export abstract class ErrorRecepcionBolsin extends Error {
  protected constructor(mensaje: string) {
    super(mensaje);
    this.name = new.target.name;
  }
}

/** No existe la entidad pedida, o no está disponible para este usuario. */
export class EntidadNoEncontradaError extends ErrorRecepcionBolsin {
  constructor(mensaje: string) {
    super(mensaje);
  }
}

/** La operación pedida no es válida en el flujo del caso de uso. */
export class OperacionInvalidaError extends ErrorRecepcionBolsin {
  constructor(mensaje: string) {
    super(mensaje);
  }
}
