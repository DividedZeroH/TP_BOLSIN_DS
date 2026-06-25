import { ComisionMedicaRegistro } from './comision-medica.registro';
import { CambioEstadoRegistro } from './cambio-estado.registro';
import { RemitoRegistro } from './remito.registro';

/** Estructura plana del agregado Bolsin completo (sin tipos `Prisma.*`). */
export interface BolsinCompletoRegistro {
  id: number;
  numeroPrecinto: number;
  comisionMedicaOrigen: ComisionMedicaRegistro;
  comisionMedicaDestino: ComisionMedicaRegistro;
  cambiosEstado: CambioEstadoRegistro[];
  remitos: RemitoRegistro[];
}
