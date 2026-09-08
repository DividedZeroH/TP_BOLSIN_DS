import { Injectable, Logger } from '@nestjs/common';
import { INotificadorRecepcion } from '../../application/ports/out/notificador-recepcion';

/**
 * Adaptador provisorio del `<<include>>` al CU29, que no forma parte de esta
 * entrega: deja constancia en el log. Cuando el CU29 exista, se reemplaza este
 * adaptador sin tocar el gestor.
 */
@Injectable()
export class NotificadorCU29Log implements INotificadorRecepcion {
  private readonly logger = new Logger(NotificadorCU29Log.name);

  notificarRecepcionRegistrada(bolsinId: number): void {
    this.logger.log(`CU29 solicitado para el bolsín ${bolsinId}.`);
  }
}
