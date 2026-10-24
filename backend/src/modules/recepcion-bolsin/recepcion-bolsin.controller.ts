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
import { NuevaRecepcionDto, TomarBolsinDto, TomarOpcionDto } from './dto/solicitudes';
import { GestorRegistrarRecepcionBolsin } from './gestor-registrar-recepcion-bolsin.service';

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

  @Delete(':recepcionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  cancelar(@Param('recepcionId', ParseUUIDPipe) recepcionId: string): void {
    this.gestor.cancelarRecepcion(recepcionId);
  }
}
