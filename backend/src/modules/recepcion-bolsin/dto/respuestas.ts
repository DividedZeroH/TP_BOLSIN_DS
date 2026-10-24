import { OpcionRecepcion } from '../opciones-recepcion';
import { PasoRecepcion } from '../recepcion-en-curso.store';

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

/** `nuevaRecepcionBolsin()` → `mostrarDatosBolsinesParaSeleccion()`. */
export interface InicioRecepcionDto {
  recepcionId: string;
  usuarioLogueado: UsuarioLogueadoDto;
  comisionMedica: ComisionMedicaDto;
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
export interface ResultadoRecepcionDto {
  mensaje: string;
  numeroPrecinto: number;
  estadoBolsin: string;
  estadoRemitos: string;
  estadoDocumentacion: string;
  fechaHora: string;
}

/** Para rehidratar la pantalla (no es un mensaje del diagrama). */
export interface EstadoRecepcionDto extends Omit<InicioRecepcionDto, 'usuarioLogueado'> {
  paso: PasoRecepcion;
  numeroPrecinto?: number;
  opcionCodigo?: string;
}
