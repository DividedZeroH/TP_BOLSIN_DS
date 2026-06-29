import { ComisionMedicaRegistro } from './comision-medica.registro';

/** Resumen de bolsín usado en la pantalla de inicio del CU. */
export interface BolsinResumenRegistro {
  id: number;
  numeroPrecinto: number;
  comisionMedicaOrigen: ComisionMedicaRegistro;
}
