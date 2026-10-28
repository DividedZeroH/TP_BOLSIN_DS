import { IsIn, IsInt, IsPositive } from 'class-validator';
import { CodigoOpcionRecepcion, OPCIONES_RECEPCION } from '../opciones-recepcion';

export class NuevaRecepcionDto {
  @IsInt()
  @IsPositive()
  sesionId!: number;
}

export class TomarBolsinDto {
  @IsInt()
  @IsPositive()
  numeroPrecinto!: number;
}

/**
 * Acepta cualquiera de las cuatro opciones del análisis: que esté
 * implementada lo decide `tomarOpcion()`, no la validación del DTO.
 */
export class TomarOpcionDto {
  @IsIn(OPCIONES_RECEPCION)
  codigo!: CodigoOpcionRecepcion;
}
