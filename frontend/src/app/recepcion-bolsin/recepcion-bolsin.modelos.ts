export const OPCION_CONTENIDO_IGUAL = 'CONTENIDO_IGUAL' as const;
export const OPCION_FALTA_DOCUMENTACION = 'FALTA_DOCUMENTACION' as const;
export const OPCION_DOCUMENTACION_NO_CORRESPONDE = 'DOCUMENTACION_NO_CORRESPONDE' as const;
export const OPCION_REDIRIGIR_OTRA_AREA = 'REDIRIGIR_OTRA_AREA' as const;

export type CodigoOpcionRecepcion =
  | typeof OPCION_CONTENIDO_IGUAL
  | typeof OPCION_FALTA_DOCUMENTACION
  | typeof OPCION_DOCUMENTACION_NO_CORRESPONDE
  | typeof OPCION_REDIRIGIR_OTRA_AREA;

export interface OpcionRecepcionVista {
  codigo: CodigoOpcionRecepcion;
  descripcion: string;
}

export interface UsuarioLogueadoVista {
  id?: number;
  apellido?: string;
  email?: string;
}

export interface ComisionMedicaVista {
  id: number;
  nombre: string;
}

export interface BolsinVista {
  id: number;
  numeroBolsin?: string;
  numeroPrecinto: number;
  fecha?: string;
  peso?: number;
  comisionMedicaOrigen: ComisionMedicaVista;
}

export interface InicioRecepcion {
  usuarioLogueado?: UsuarioLogueadoVista;
  comisionMedica: ComisionMedicaVista;
  bolsines: BolsinVista[];
}

export interface DocumentacionVista {
  id: number;
  numero?: string | number;
  tipo: string;
  asunto: string;
}

export interface RemitoVista {
  id: number;
  numero: number;
  documentaciones: DocumentacionVista[];
}

export interface DetalleBolsinVista {
  id: number;
  numeroBolsin?: string;
  numeroPrecinto: number;
  remitos: RemitoVista[];
  opciones?: OpcionRecepcionVista[];
}

export interface ResultadoRecepcionBolsin {
  bolsinId: number;
  estadoBolsin?: string;
  estadoRemitos?: string;
  estadoDocumentaciones?: string;
  fechaHora: string;
}
