import { ComisionMedica } from '../entity/comision-medica.entity';
export const COMISIONES_MEDICAS_REPOSITORY = Symbol('COMISIONES_MEDICAS_REPOSITORY');
export interface ComisionesMedicasRepositoryInterface {
  buscarPorId(id: number): Promise<ComisionMedica | null>;
}
