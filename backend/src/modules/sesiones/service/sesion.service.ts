import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Sesion } from '../entity/sesion.entity';
import { Usuario } from '../../usuarios/entity/usuario.entity';
import { UsuariosService } from '../../usuarios/service/usuarios.service';
import { EmpleadosService } from '../../empleados/service/empleados.service';
import { ComisionesMedicasService } from '../../comisiones-medicas/service/comisiones-medicas.service';
import {
  SESIONES_REPOSITORY,
  SesionesRepositoryInterface,
} from '../repository/sesiones.repository.interface';

@Injectable()
export class SesionService {
  constructor(
    @Inject(SESIONES_REPOSITORY) private readonly repository: SesionesRepositoryInterface,
    private readonly usuariosService: UsuariosService,
    private readonly empleadosService: EmpleadosService,
    private readonly comisionesMedicasService: ComisionesMedicasService,
  ) {}

  async buscarSesion(id: number): Promise<Sesion> {
    const sesion = await this.repository.buscarPorId(id);
    if (!sesion) throw new NotFoundException('No se encontró la sesión indicada.');
    sesion.usuario = await this.usuariosService.buscarUsuario(sesion.usuarioId);
    return sesion;
  }

  getUsuarioLogueado(sesion: Sesion): Usuario {
    return sesion.usuario;
  }

  async consultarComisionMedica(id: number) {
    const usuario = this.getUsuarioLogueado(await this.buscarSesion(id));
    const empleado = this.usuariosService.getEmpleado(usuario);
    const comision = this.empleadosService.getComisionMedica(empleado);
    return {
      usuarioLogueado: {
        id: empleado.id,
        apellido: empleado.apellido,
        email: empleado.email,
      },
      comisionMedica: {
        id: comision.id,
        nombre: this.comisionesMedicasService.getNombre(comision),
      },
    };
  }
}
