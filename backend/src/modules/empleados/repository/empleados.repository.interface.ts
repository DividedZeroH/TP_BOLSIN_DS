import { Empleado } from '../entity/empleado.entity';
export const EMPLEADOS_REPOSITORY = Symbol('EMPLEADOS_REPOSITORY');
export interface EmpleadosRepositoryInterface {
  buscarPorId(id: number): Promise<Empleado | null>;
}
