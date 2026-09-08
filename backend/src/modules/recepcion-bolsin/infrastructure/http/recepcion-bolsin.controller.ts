import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseFilters,
} from '@nestjs/common';
import {
  IRegistrarRecepcionBolsin,
  REGISTRAR_RECEPCION_BOLSIN,
} from '../../application/ports/in/registrar-recepcion-bolsin.port';
import { ConfirmarRecepcionBolsinDto } from '../../application/dto/recepcion-bolsin.modelos';
import { ErroresRecepcionBolsinFilter } from './errores-recepcion-bolsin.filter';

/**
 * Adaptador de entrada HTTP: traduce solicitudes web a mensajes del puerto de
 * entrada. Depende de la interfaz `IRegistrarRecepcionBolsin`, no del gestor
 * concreto, así que el caso de uso podría exponerse por otro transporte sin
 * tocar la capa de aplicación.
 */
@Controller('recepciones-bolsines')
@UseFilters(ErroresRecepcionBolsinFilter)
export class RecepcionBolsinController {
  constructor(
    @Inject(REGISTRAR_RECEPCION_BOLSIN)
    private readonly recepcion: IRegistrarRecepcionBolsin,
  ) {}

  @Get('iniciar')
  iniciar(@Query('sesionId', ParseIntPipe) sesionId: number) {
    return this.recepcion.nuevaRecepcionBolsin(sesionId);
  }

  @Get(':bolsinId')
  obtenerDetalle(
    @Param('bolsinId', ParseIntPipe) bolsinId: number,
    @Query('sesionId', ParseIntPipe) sesionId: number,
  ) {
    return this.recepcion.tomarBolsin(sesionId, bolsinId);
  }

  @Post(':bolsinId/confirmar')
  confirmar(
    @Param('bolsinId', ParseIntPipe) bolsinId: number,
    @Body() dto: ConfirmarRecepcionBolsinDto,
  ) {
    this.recepcion.tomarOpcion(dto.opcion);
    return this.recepcion.tomarConfirmacion(
      Number(dto.sesionId),
      bolsinId,
      dto.confirmacion,
    );
  }
}
