import { Usuario } from '../entity/usuario.entity';
export const USUARIOS_REPOSITORY = Symbol('USUARIOS_REPOSITORY');
export interface UsuariosRepositoryInterface {
  buscarPorId(id: number): Promise<Usuario | null>;
}
