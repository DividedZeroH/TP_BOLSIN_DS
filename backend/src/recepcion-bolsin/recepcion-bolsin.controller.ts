import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { GestorRegistrarRecepcionBolsin } from './gestor-registrar-recepcion-bolsin.service';
import { ConfirmarRecepcionBolsinDto } from './recepcion-bolsin.modelos';

/** Adaptador HTTP: traduce solicitudes web a mensajes dirigidos al Gestor. */
@Controller('recepciones-bolsines')
export class RecepcionBolsinController {
  constructor(private readonly gestor: GestorRegistrarRecepcionBolsin) {}

  @Get('iniciar')
  iniciar(@Query('sesionId', ParseIntPipe) sesionId: number) {
    return this.gestor.nuevaRecepcionBolsin(sesionId);
  }

  @Get(':bolsinId')
  obtenerDetalle(
    @Param('bolsinId', ParseIntPipe) bolsinId: number,
    @Query('sesionId', ParseIntPipe) sesionId: number,
  ) {
    return this.gestor.tomarBolsin(sesionId, bolsinId);
  }

  @Post(':bolsinId/confirmar')
  confirmar(
    @Param('bolsinId', ParseIntPipe) bolsinId: number,
    @Body() dto: ConfirmarRecepcionBolsinDto,
  ) {
    return this.gestor.confirmarRecepcion(
      Number(dto.sesionId),
      bolsinId,
      dto.opcion,
      dto.confirmacion,
    );
  }
}
