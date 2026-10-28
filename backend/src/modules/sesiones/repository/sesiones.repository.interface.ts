import { Sesion } from '../entity/sesion.entity';
export const SESIONES_REPOSITORY = Symbol('SESIONES_REPOSITORY');
export interface SesionesRepositoryInterface {
  buscarPorId(id: number): Promise<Sesion | null>;
}
