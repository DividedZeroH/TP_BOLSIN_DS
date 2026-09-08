import { ComisionMedicaRegistro } from './comision-medica.registro';

/** Datos planos del empleado, ya incluyendo su comisión médica. */
export interface EmpleadoConComisionRegistro {
  id: number;
  apellido: string;
  email: string;
  comisionMedica: ComisionMedicaRegistro;
}
