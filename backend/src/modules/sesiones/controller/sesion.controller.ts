import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { SesionService } from '../service/sesion.service';

@Controller('sesiones')
export class SesionController {
  constructor(private readonly sesionService: SesionService) {}

  /** Lo que muestra el panel: quién está logueado y en qué comisión trabaja. */
  @Get(':id/comision-medica')
  async comisionMedica(@Param('id', ParseIntPipe) id: number) {
    return this.sesionService.consultarComisionMedica(id);
  }
}
