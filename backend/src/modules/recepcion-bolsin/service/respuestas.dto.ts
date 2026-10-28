import { OpcionRecepcion } from '../opciones-recepcion';
import {
  PasoRecepcion,
  ResultadoRecepcion,
} from '../repository/recepciones-en-curso.repository.interface';

export interface ComisionMedicaDto {
  id: number;
  nombre: string;
}

export interface UsuarioLogueadoDto {
  id: number;
  apellido?: string;
  email?: string;
}

export interface BolsinResumenDto {
  id: number;
  numeroPrecinto: number;
  comisionMedicaOrigen: ComisionMedicaDto;
}

/** `nuevaRecepcionBolsin()` → `mostrarComisionMedicaUsuario()`. */
export interface InicioRecepcionDto {
  recepcionId: string;
  usuarioLogueado: UsuarioLogueadoDto;
  comisionMedica: ComisionMedicaDto;
}

/** Se solicita después de mostrar la comisión, antes de seleccionar el bolsín. */
export interface BolsinesParaSeleccionDto {
  bolsines: BolsinResumenDto[];
}

export interface DocumentacionDto {
  id: number;
  numeroRemito: number;
  tipo: string;
  asunto: string;
}

/**
 * `tomarBolsin()` → `mostrarDocumentacionBolsin()` +
 * `mostrarOpcionesRecepcionParaSeleccion()`.
 */
export interface BolsinSeleccionadoDto {
  bolsin: BolsinResumenDto;
  documentacion: DocumentacionDto[];
  opciones: OpcionRecepcion[];
}

/** `tomarOpcion()` → `pedirConfirmacion()`. */
export interface PedidoConfirmacionDto {
  confirma: true;
  mensaje: string;
}

/** `tomarConfirmacion()` → `informarEjecucionExitosa()`. */
export type ResultadoRecepcionDto = ResultadoRecepcion;

/** Para rehidratar la pantalla (no es un mensaje del diagrama). */
export interface EstadoRecepcionDto extends Omit<InicioRecepcionDto, 'usuarioLogueado'> {
  paso: PasoRecepcion;
  bolsines: BolsinResumenDto[];
  numeroPrecinto?: number;
  opcionCodigo?: string;
}
