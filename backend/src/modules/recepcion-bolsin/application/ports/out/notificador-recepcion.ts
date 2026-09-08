/** Token de inyección DIP del notificador de recepciones. */
export const NOTIFICADOR_RECEPCION = 'NOTIFICADOR_RECEPCION';

/**
 * Puerto de salida que materializa el `<<include>>` al CU29 ("Notificar
 * Recepción de Bolsín") del diagrama de secuencia.
 *
 * El gestor anuncia el hecho; quién lo escucha y cómo (hoy un log, mañana el
 * CU29 real, un mail o una cola) es un adaptador enchufable. Antes esto era
 * una llamada directa al `Logger` de NestJS dentro de la capa de aplicación.
 */
export interface INotificadorRecepcion {
  notificarRecepcionRegistrada(bolsinId: number): void;
}
