import { Usuario } from './usuario';

export class Sesion {
  constructor(
    public readonly id: number,
    private readonly usuario: Usuario,
  ) {}

  getUsuarioLogueado(): Usuario {
    return this.usuario;
  }
}
