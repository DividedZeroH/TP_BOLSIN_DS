/**
 * API pública del subdominio Organización.
 *
 * Es un subdominio de kernel compartido: `ComisionMedica` es el mismo concepto
 * para identidad (a qué comisión pertenece un empleado) y para recepción de
 * bolsín (origen y destino), así que la entidad se comparte. Lo que NO se
 * comparte es su representación persistente: cada módulo define su propio
 * `ComisionMedicaRegistro`.
 *
 * No expone un módulo de NestJS porque todavía no aporta providers.
 */
export { ComisionMedica } from './domain/comisionMedica';
