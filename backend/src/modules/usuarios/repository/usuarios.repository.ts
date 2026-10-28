import { Injectable } from '@nestjs/common';
import { ContextoPersistencia } from '../../../database/transaction/contexto-persistencia';
import { Usuario } from '../entity/usuario.entity';
import { UsuariosRepositoryInterface } from './usuarios.repository.interface';

@Injectable()
export class UsuariosRepository implements UsuariosRepositoryInterface {
  constructor(private readonly persistencia: ContextoPersistencia) {}

  buscarPorId(id: number): Promise<Usuario | null> {
    return this.persistencia.obtenerManager().findOneBy(Usuario, { id });
  }
}
