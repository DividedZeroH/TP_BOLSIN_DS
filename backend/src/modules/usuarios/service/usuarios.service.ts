import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Usuario } from '../entity/usuario.entity';
import { Empleado } from '../../empleados/entity/empleado.entity';
import { EmpleadosService } from '../../empleados/service/empleados.service';
import {
  USUARIOS_REPOSITORY,
  UsuariosRepositoryInterface,
} from '../repository/usuarios.repository.interface';

@Injectable()
export class UsuariosService {
  constructor(
    @Inject(USUARIOS_REPOSITORY) private readonly repository: UsuariosRepositoryInterface,
    private readonly empleadosService: EmpleadosService,
  ) {}
  async buscarUsuario(id: number): Promise<Usuario> {
    const usuario = await this.repository.buscarPorId(id);
    if (!usuario) throw new NotFoundException('No se encontró el usuario indicado.');
    usuario.empleado = await this.empleadosService.buscarEmpleado(usuario.empleadoId);
    return usuario;
  }
  getEmpleado(usuario: Usuario): Empleado {
    return usuario.empleado;
  }
}
