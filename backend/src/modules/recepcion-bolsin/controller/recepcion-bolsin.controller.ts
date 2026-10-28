import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { NuevaRecepcionDto, TomarBolsinDto, TomarOpcionDto } from './solicitudes.dto';
import { GestorRegistrarRecepcionBolsin } from '../service/gestor-registrar-recepcion-bolsin.service';

/** Cada endpoint es un mensaje de la pantalla al gestor en el diagrama de secuencia. */
@Controller('recepciones-bolsines')
export class RecepcionBolsinController {
  constructor(private readonly gestor: GestorRegistrarRecepcionBolsin) {}

  @Post()
  nuevaRecepcionBolsin(@Body() dto: NuevaRecepcionDto) {
    return this.gestor.nuevaRecepcionBolsin(dto.sesionId);
  }

  @Get(':recepcionId')
  consultar(@Param('recepcionId', ParseUUIDPipe) recepcionId: string) {
    return this.gestor.consultarRecepcion(recepcionId);
  }

  @Get(':recepcionId/bolsines')
  consultarBolsinesParaSeleccion(
    @Param('recepcionId', ParseUUIDPipe) recepcionId: string,
  ) {
    return this.gestor.consultarBolsinesParaSeleccion(recepcionId);
  }

  @Post(':recepcionId/bolsin')
  @HttpCode(HttpStatus.OK)
  tomarBolsin(
    @Param('recepcionId', ParseUUIDPipe) recepcionId: string,
    @Body() dto: TomarBolsinDto,
  ) {
    return this.gestor.tomarBolsin(recepcionId, dto.numeroPrecinto);
  }

  @Post(':recepcionId/opcion')
  @HttpCode(HttpStatus.OK)
  tomarOpcion(
    @Param('recepcionId', ParseUUIDPipe) recepcionId: string,
    @Body() dto: TomarOpcionDto,
  ) {
    return this.gestor.tomarOpcion(recepcionId, dto.codigo);
  }

  @Post(':recepcionId/confirmacion')
  @HttpCode(HttpStatus.OK)
  tomarConfirmacion(@Param('recepcionId', ParseUUIDPipe) recepcionId: string) {
    return this.gestor.tomarConfirmacion(recepcionId);
  }

  @Post(':recepcionId/fin')
  @HttpCode(HttpStatus.NO_CONTENT)
  finDelCU(@Param('recepcionId', ParseUUIDPipe) recepcionId: string): void {
    this.gestor.finDelCU(recepcionId);
  }

  @Delete(':recepcionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  cancelar(@Param('recepcionId', ParseUUIDPipe) recepcionId: string): void {
    this.gestor.cancelarRecepcion(recepcionId);
  }
}
