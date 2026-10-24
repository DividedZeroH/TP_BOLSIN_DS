import { Injectable, Logger } from '@nestjs/common';

/**
 * `<<include>>` del CU29. El CU29 real está fuera de alcance: acá solo queda
 * registrado que la recepción ocurrió.
 */
@Injectable()
export class NotificadorCU29Service {
  private readonly logger = new Logger(NotificadorCU29Service.name);

  notificarRecepcionRegistrada(numeroPrecinto: number): void {
    this.logger.log(`CU29: recepción registrada del bolsín con precinto ${numeroPrecinto}.`);
  }
}
