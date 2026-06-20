export interface ComisionMedicaVista {
  id: number;
  nombre: string;
}

export interface BolsinVista {
  id: number;
  fecha: string;
  numeroBolsin: string;
  numeroPrecinto: string;
  peso: number;
  comisionMedicaOrigen: ComisionMedicaVista;
}

export interface InicioRecepcion {
  comisionMedica: ComisionMedicaVista;
  bolsines: BolsinVista[];
}

export interface DocumentacionVista {
  id: number;
  numero: string;
  tipo: string;
  asunto: string;
}

export interface RemitoVista {
  id: number;
  numero: string;
  documentaciones: DocumentacionVista[];
}

export interface OpcionRecepcionVista {
  codigo:
    | 'CONTENIDO_IGUAL'
    | 'FALTA_DOCUMENTACION'
    | 'DOCUMENTACION_NO_CORRESPONDE'
    | 'REDIRIGIR_OTRA_AREA';
  descripcion: string;
}

export interface DetalleBolsinVista {
  id: number;
  numeroBolsin: string;
  numeroPrecinto: string;
  remitos: RemitoVista[];
  opciones: OpcionRecepcionVista[];
}

export interface ResultadoRecepcion {
  bolsinId: number;
  estadoBolsin: 'Recibido';
  estadoRemitos: 'RecibidoYAceptado';
  estadoDocumentaciones: 'Aceptada';
  fechaHora: string;
}
