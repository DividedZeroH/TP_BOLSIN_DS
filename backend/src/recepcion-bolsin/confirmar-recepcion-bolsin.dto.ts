import { OpcionRecepcion } from './recepcion-bolsin.modelos';

export class ConfirmarRecepcionBolsinDto {
  sesionId!: number;
  opcion!: OpcionRecepcion;
  confirmacion!: boolean;
}
