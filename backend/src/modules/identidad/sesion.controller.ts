import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { SesionService } from './sesion.service';

@Controller('sesiones')
export class SesionController {
  constructor(private readonly sesionService: SesionService) {}

  /** Lo que muestra el panel: quién está logueado y en qué comisión trabaja. */
  @Get(':id/comision-medica')
  async comisionMedica(@Param('id', ParseIntPipe) id: number) {
    const empleado = (await this.sesionService.buscarSesion(id))
      .getUsuarioLogueado()
      .getEmpleado();
    const comision = empleado.getComisionMedica();
    return {
      usuarioLogueado: { id: empleado.id, apellido: empleado.apellido, email: empleado.email },
      comisionMedica: { id: comision.id, nombre: comision.getNombre() },
    };
  }
}
