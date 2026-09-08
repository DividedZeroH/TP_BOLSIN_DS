import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  NotFoundException,
} from '@nestjs/common';
import {
  EntidadNoEncontradaError,
  ErrorRecepcionBolsin,
} from '../../application/errors/recepcion-bolsin.errors';

/** Contrato mínimo de la respuesta, para no atarse a los tipos de Express. */
interface RespuestaHttp {
  status(codigo: number): RespuestaHttp;
  json(cuerpo: unknown): unknown;
}

/**
 * Traduce los errores de la aplicación a códigos HTTP.
 *
 * Es el único lugar que conoce a la vez el vocabulario del caso de uso y el
 * del transporte: gracias a esto el gestor puede fallar sin saber que existen
 * los 404 y los 400.
 */
@Catch(ErrorRecepcionBolsin)
export class ErroresRecepcionBolsinFilter
  implements ExceptionFilter<ErrorRecepcionBolsin>
{
  catch(error: ErrorRecepcionBolsin, host: ArgumentsHost): void {
    const excepcion =
      error instanceof EntidadNoEncontradaError
        ? new NotFoundException(error.message)
        : new BadRequestException(error.message);

    host
      .switchToHttp()
      .getResponse<RespuestaHttp>()
      .status(excepcion.getStatus())
      .json(excepcion.getResponse());
  }
}
