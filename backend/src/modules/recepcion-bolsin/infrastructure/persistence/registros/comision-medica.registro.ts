/**
 * Datos planos de la comisión médica dentro del agregado Bolsin.
 *
 * Cada subdominio define su propia representación persistente: identidad tiene
 * la suya. Lo que se comparte es la entidad `ComisionMedica`, no esta fila.
 */
export interface ComisionMedicaRegistro {
  id: number;
  nombre: string;
}
