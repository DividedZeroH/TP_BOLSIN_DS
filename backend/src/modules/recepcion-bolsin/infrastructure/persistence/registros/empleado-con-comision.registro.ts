import { ComisionMedicaRegistro } from './comision-medica.registro';

/** Empleado responsable de un cambio de estado, con su comisión médica. */
export interface EmpleadoConComisionRegistro {
  id: number;
  apellido: string;
  email: string;
  comisionMedica: ComisionMedicaRegistro;
}
